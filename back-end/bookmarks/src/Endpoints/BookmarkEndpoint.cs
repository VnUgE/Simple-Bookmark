// Copyright (C) 2025 Vaughn Nugent
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Net;
using System.Linq;
using System.Buffers;
using System.Collections;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json.Serialization;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.EntityFrameworkCore;

using VNLib.Utils;
using VNLib.Utils.IO;
using VNLib.Utils.Memory;
using VNLib.Utils.Extensions;
using VNLib.Net.Http;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Accounts;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Essentials.Extensions;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Loading.Routing;
using VNLib.Plugins.Extensions.Data.Extensions;
using VNLib.Plugins.Extensions.Validation;
using VNLib.Plugins.Extensions.Loading.Routing.Mvc;
using VNLib.Plugins.Essentials.Sessions;
using static VNLib.Plugins.Essentials.Endpoints.ResourceEndpointBase;

using SimpleBookmark.Model;

namespace SimpleBookmark.Endpoints
{
    
    [EndpointLogName("Bookmarks")]
    [ConfigurationName("bookmarks")]
    internal sealed class BookmarkEndpoint(PluginBase plugin, IConfigScope config) : IHttpController
    {
        private static readonly IValidator<BookmarkEntry> BmValidator = BookmarkEntry.GetValidator();

        private readonly BookmarkStore Bookmarks = plugin.GetOrCreateSingleton<BookmarkStore>();
        private readonly BookmarkStoreConfig BmConfig = config.Deserialze<BookmarkStoreConfig>();

        //Users must have read permissions to access these endpoints
        public bool PreProccess(HttpEntity entity) => entity.Session.CanRead();

        public ProtectionSettings GetProtectionSettings() => default;       

        #region bookmark endpoints

        [HttpStaticRoute("{{path}}/bookmarks", HttpMethod.GET)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnGetBookmarksAsync(HttpEntity entity)
        {
            if (entity.QueryArgs.TryGetNonEmptyValue("id", out string? singleId))
            {
                //Try to get single record for the current user
                BookmarkEntry? single = await Bookmarks.GetSingleUserRecordAsync(singleId, entity.Session.UserID);

                //Return result
                return single is null ? VfReturnType.NotFound : VirtualOkJson(entity, single);
            }
            else
            {

                //Get query parameters
                _ = entity.QueryArgs.TryGetNonEmptyValue("limit", out string? limitS);
                _ = uint.TryParse(limitS, out uint limit);
                //Clamp limit to max limit
                limit = Math.Clamp(limit, BmConfig.DefaultLimit, BmConfig.MaxLimit);

                //try to parse offset
                _ = entity.QueryArgs.TryGetNonEmptyValue("page", out string? offsetS);
                _ = uint.TryParse(offsetS, out uint offset);

                //Get any query arguments
                if (entity.QueryArgs.TryGetNonEmptyValue("q", out string? query))
                {
                    //Replace percent encoding with spaces
                    query = query.Replace('+', ' ');
                }

                string[] tags = Array.Empty<string>();

                //Get tags
                if (entity.QueryArgs.TryGetNonEmptyValue("t", out string? tagsS))
                {
                    //Split tags at spaces and remove empty entries
                    tags = tagsS.Split('+')
                        .Where(static t => !string.IsNullOrWhiteSpace(t))
                        .ToArray();
                }

                //Get bookmarks
                BookmarkEntry[] bookmarks = await Bookmarks.SearchBookmarksAsync(
                    userId : entity.Session.UserID,
                    query,
                    tags,
                    (int)limit,
                    (int)offset,
                    cancellation: entity.EventCancellation
                );

                //Return result
                return VirtualOkJson(entity, bookmarks);
            }
        }

        [HttpStaticRoute("{{path}}/bookmarks", HttpMethod.DELETE)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnDeleteBookmarksAsync(HttpEntity entity)
        {
            WebMessage webm = new();

            if (webm.Assert(entity.Session.CanDelete(), "You do not have permissions to delete records"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            if (!entity.QueryArgs.TryGetNonEmptyValue("id", out string? deleteId))
            {
                webm.Result = "No id was provided";
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            //Try to delete the record
            ERRNO result = await Bookmarks.DeleteUserRecordAsync(deleteId, entity.Session.UserID);

            if (webm.Assert(result > 0, "Requested bookmark does not exist"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.NotFound);
            }

            webm.Result = "Successfully deleted bookmark";
            webm.Success = true;

            return VirtualClose(entity, webm, HttpStatusCode.OK);
        }

        [HttpStaticRoute("{{path}}/bookmarks", HttpMethod.POST)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnAddBookmarkAsync(HttpEntity entity)
        {
            WebMessage webm = new();

            if (webm.Assert(entity.Session.CanWrite(), "You do not have permissions to create records"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            //try to get the update from the request body
            BookmarkEntry? newBookmark = await entity.GetJsonFromFileAsync<BookmarkEntry>();

            if (webm.Assert(newBookmark != null, "No data was provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            //Remove any user id from the update
            newBookmark.UserId = null;

            if (!BmValidator.Validate(newBookmark, webm))
            {
                return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
            }

            /*
             * Add the new entry to the database if the user is below their quota
             * and the entry does not already exist by the desired url.
             */
            int result = await Bookmarks.AddSingleIfNotExists(
                userId: entity.Session.UserID,
                entry: newBookmark,
                now: entity.RequestedTimeUtc.DateTime,
                maxRecords: BmConfig.PerPersonQuota,
                cancellation: entity.EventCancellation
            );

            if (webm.Assert(result > -1, "You have reached your bookmark quota"))
            {
                return VirtualOk(entity, webm);
            }

            if (webm.Assert(result > 0, "Bookmark with the same url alreay exists"))
            {
                return VirtualOk(entity, webm);
            }

            webm.Result = "Successfully created bookmark";
            webm.Success = true;

            return VirtualClose(entity, webm, HttpStatusCode.Created);
        }

        [HttpStaticRoute("{{path}}/bookmarks", HttpMethod.PATCH)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnUpdateBookmarkAsync(HttpEntity entity)
        {
            WebMessage webm = new();

            if (webm.Assert(entity.Session.CanWrite(), "You do not have permissions to update records"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            //try to get the update from the request body
            BookmarkEntry? update = await entity.GetJsonFromFileAsync<BookmarkEntry>();

            if (webm.Assert(update != null, "No data was provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            if (webm.Assert(update!.Id != null, "The bookmark object is malformatted for this request"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            //Remove any user id from the update
            update.UserId = null;

            if (!BmValidator.Validate(update, webm))
            {
                return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
            }

            //Try to update the record
            ERRNO result = await Bookmarks.UpdateUserRecordAsync(update, entity.Session.UserID, entity.EventCancellation);

            if (webm.Assert(result > 0, "Failed to update existing record"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.NotFound);
            }

            webm.Result = "Successfully updated bookmark";
            webm.Success = true;

            return VirtualClose(entity, webm, HttpStatusCode.OK);
        }

        [HttpStaticRoute("{{path}}/bookmarks/bulk", HttpMethod.POST)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnBulkUpdateAsync(HttpEntity entity)
        {
            WebMessage webm = new();

            if (webm.Assert(entity.Session.CanWrite(), "You do not have permissions to update records"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            //See if the user wants to fail on invalid records
            bool failOnInvalid = entity.QueryArgs.ContainsKey("failOnInvalid");

            //try to get the update from the request body
            BookmarkEntry[]? batch = await entity.GetJsonFromFileAsync<BookmarkEntry[]>();

            if (webm.Assert(batch != null, "No data was provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            //filter out any null entries
            IEnumerable<BookmarkEntry> sanitized = batch.Where(static b => b != null);

            if (failOnInvalid)
            {
                //Get any invalid entires and create a validation result
                BookmarkError[] invalidEntires = sanitized.Select(static b =>
                {
                    ValidationResult result = BmValidator.Validate(b);
                    if(result.IsValid)
                    {
                        return null;
                    }

                    return new BookmarkError()
                    {
                        Errors = result.GetErrorsAsCollection(),
                        Subject = b
                    };

                })
                .Where(static b => b != null)
                .ToArray()!;

                //At least one error
                if (invalidEntires.Length > 0)
                {
                    //Notify the user of the invalid entires
                    BatchUploadResult res = new()
                    {
                        Errors = invalidEntires
                    };

                    webm.Result = res;
                    return VirtualOk(entity, webm);
                }
            }
            else
            {
                //Remove any invalid entires
                sanitized = sanitized.Where(static b => BmValidator.Validate(b).IsValid);
            }
            try
            {
                //Try to update the records
                ERRNO result = await Bookmarks.AddBulkAsync(
                    bookmarks: sanitized,
                    userId: entity.Session.UserID,
                    now: entity.RequestedTimeUtc,
                    cancellation: entity.EventCancellation
                );

                webm.Result = $"Successfully added {result} of {batch.Length} bookmarks";
                webm.Success = true;

                return VirtualClose(entity, webm, HttpStatusCode.OK);
            }
            catch (DbUpdateException dbe) when (dbe.InnerException is not null)
            {
                //Set entire batch as an error
                webm.Result = GetResultFromEntires(batch, dbe.InnerException.Message);
                return VirtualOk(entity, webm);
            }
        }

        #endregion

        [HttpStaticRoute("{{path}}/tags", HttpMethod.GET)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnGetTagsAsync(HttpEntity entity)
        {
            //Try to get all tags for the current user
            string[] allTags = await Bookmarks.GetAllTagsForUserAsync(entity.Session.UserID, entity.EventCancellation);
           
            return VirtualOkJson(entity, allTags);
        }

        [HttpStaticRoute("{{path}}/count", HttpMethod.GET)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnGetAccountAsync(HttpEntity entity)
        {
            //Try to get count
            long count = await Bookmarks.GetUserRecordCountAsync(entity.Session.UserID, entity.EventCancellation);

            WebMessage webm = new ()
            {
                Result = count,
                Success = true
            };
           
            return VirtualOk(entity, webm);
        }

        [HttpStaticRoute("{{path}}/export", HttpMethod.GET)]
        [HttpRouteProtection(AuthorzationCheckLevel.Critical, AllowNewSession = false, SessionType = SessionType.Web)]
        public async ValueTask<VfReturnType> OnExportBookmarksAsync(HttpEntity entity)
        {
            bool html = entity.Server.Accept.Contains("text/html");
            bool csv = entity.Server.Accept.Contains("text/csv");
            bool json = entity.Server.Accept.Contains("application/json");

            if (!html & !csv & !json)
            {
                return VirtualClose(entity, HttpStatusCode.NotAcceptable);
            }
            
            //Get the collection of bookmarks
            List<BookmarkEntry> list = Bookmarks.ListRental.Rent();

            await Bookmarks.GetUserPageAsync(
                collection: list,
                userId: entity.Session.UserID,
                page: 0,
                limit: (int)BmConfig.PerPersonQuota
            );

            //Alloc memory stream for output
            VnMemoryStream output = new(MemoryUtil.Shared, 16 * 1024, false);
            try
            {
                //Write the bookmarks as a netscape file and return the file
                if (html)
                {
                    ImportExportUtil.ExportToNetscapeFile(list, output);

                    output.Seek(0, System.IO.SeekOrigin.Begin);
                    return VirtualClose(entity, HttpStatusCode.OK, ContentType.Html, output);
                }
                else if (csv)
                {
                    ImportExportUtil.ExportAsCsv(list, output);

                    output.Seek(0, System.IO.SeekOrigin.Begin);
                    return VirtualClose(entity, HttpStatusCode.OK, ContentType.Csv, output);
                }
                else if (json)
                {
                    ImportExportUtil.ExportAsJson(list, output);

                    output.Seek(0, System.IO.SeekOrigin.Begin);
                    return VirtualClose(entity, HttpStatusCode.OK, ContentType.Json, output);
                }
            }
            catch
            {
                output.Dispose();
                throw;
            }
            finally
            {
                list.TrimExcess();
                Bookmarks.ListRental.Return(list);
            }

            return VirtualClose(entity, HttpStatusCode.NotAcceptable);
        }
      

        private static BatchUploadResult GetResultFromEntires(IEnumerable<BookmarkEntry> errors, string message)
        {
            BookmarkError[] invalidEntires = errors.Select(e => new BookmarkError
            {
                Errors = new object[] { new ValidationFailure(string.Empty, message) },
                Subject = e
            }).ToArray();

            return new BatchUploadResult()
            {
                Errors = invalidEntires,
                Message = message
            };
        }
       

        sealed class BatchUploadResult
        {
            [JsonPropertyName("invalid")]
            public BookmarkError[]? Errors { get; set; }

            [JsonPropertyName("message")]
            public string? Message { get; set; }
        }

        sealed class BookmarkError
        {
            [JsonPropertyName("errors")]
            public ICollection? Errors { get; set; }

            [JsonPropertyName("subject")]
            public BookmarkEntry? Subject { get; set; }
        }
    }
}

// Copyright (C) 2024 Vaughn Nugent
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
using System.Text.Json;
using System.Collections;
using SimpleBookmark.Model;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json.Serialization;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.EntityFrameworkCore;

using VNLib.Utils;
using VNLib.Utils.Logging;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Accounts;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Essentials.Extensions;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Loading.Sql;
using VNLib.Plugins.Extensions.Data.Extensions;
using VNLib.Plugins.Extensions.Validation;

namespace SimpleBookmark.Endpoints
{

    [ConfigurationName("bm_endpoint")]
    internal sealed class BookmarkEndpoint : ProtectedWebEndpoint
    {
        private static readonly IValidator<BookmarkEntry> BmValidator = BookmarkEntry.GetValidator();

        private readonly BookmarkStore Bookmarks;
        private readonly BookmarkStoreConfig BmConfig;

        public BookmarkEndpoint(PluginBase plugin, IConfigScope config)
        {
            string? path = config.GetRequiredProperty("path", p => p.GetString()!);
            InitPathAndLog(path, plugin.Log);

            //Init new bookmark store
            IAsyncLazy<DbContextOptions> options = plugin.GetContextOptionsAsync();
            Bookmarks = new BookmarkStore(options);

            //Load config
            BmConfig = config.GetRequiredProperty("config", p => p.Deserialize<BookmarkStoreConfig>()!);
        }

        ///<inheritdoc/>
        protected override async ValueTask<VfReturnType> GetAsync(HttpEntity entity)
        {
            if (!entity.Session.CanRead())
            {
                WebMessage webm = new()
                {
                    Result = "You do not have permissions to read records",
                    Success = false
                };

                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            if (entity.QueryArgs.TryGetNonEmptyValue("id", out string? singleId))
            {
                //Try to get single record for the current user
                BookmarkEntry? single = await Bookmarks.GetSingleUserRecordAsync(singleId, entity.Session.UserID);

                //Return result
                return single is null ? VfReturnType.NotFound : VirtualOkJson(entity, single);
            }

            if (entity.QueryArgs.ContainsKey("getTags"))
            {
                //Try to get all tags for the current user
                string[] allTags = await Bookmarks.GetAllTagsForUserAsync(entity.Session.UserID, entity.EventCancellation);

                //Return result
                return VirtualOkJson(entity, allTags);
            }

            //See if count query
            if(entity.QueryArgs.TryGetNonEmptyValue("count", out string? countS))
            {
                //Try to get count
                long count = await Bookmarks.GetUserRecordCountAsync(entity.Session.UserID, entity.EventCancellation);

                WebMessage webm = new ()
                {
                    Result = count,
                    Success = true
                };

                //Return result
                return VirtualOk(entity, webm);
            }

            //Get query parameters
            _ = entity.QueryArgs.TryGetNonEmptyValue("limit", out string? limitS);
            _ = uint.TryParse(limitS, out uint limit);
            //Clamp limit to max limit
            limit = Math.Clamp(limit, BmConfig.DefaultLimit, BmConfig.MaxLimit);

            //try to parse offset
            _ = entity.QueryArgs.TryGetNonEmptyValue("page", out string? offsetS);
            _ = uint.TryParse(offsetS, out uint offset);

            //Get any query arguments
            if(entity.QueryArgs.TryGetNonEmptyValue("q", out string? query))
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
                entity.Session.UserID,
                query,
                tags,
                (int)limit,
                (int)offset,
                entity.EventCancellation
            );

            //Return result
            return VirtualOkJson(entity, bookmarks);
        }

        ///<inheritdoc/>
        protected override async ValueTask<VfReturnType> PostAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

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

            //See if the uses has reached their quota
            long count = await Bookmarks.GetUserRecordCountAsync(entity.Session.UserID, entity.EventCancellation);

            if(webm.Assert(count <= BmConfig.PerPersonQuota, "You have reached your bookmark quota"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.OK);
            }              

            //Try to create the record
            ERRNO result = await Bookmarks.CreateUserRecordAsync(newBookmark, entity.Session.UserID, entity.EventCancellation);

            if (webm.Assert(result > 0, "Failed to create new bookmark"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.OK);
            }

            webm.Result = "Successfully created bookmark";
            webm.Success = true;

            return VirtualClose(entity, webm, HttpStatusCode.Created);
        }

        ///<inheritdoc/>
        protected override async ValueTask<VfReturnType> PatchAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

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

        /*
         * PUT method is only used for bulk uploads
         */

        ///<inheritdoc/>
        protected override async ValueTask<VfReturnType> PutAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

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
                BookmarkError[] invalidEntires = sanitized.Select(b =>
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
                if(invalidEntires.Length > 0)
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

            //Try to update the records
            ERRNO result = await Bookmarks.AddBulkAsync(sanitized, entity.Session.UserID, false, entity.EventCancellation);

            webm.Result = $"Successfully added {result} of {batch.Length} bookmarks";
            webm.Success = true;

            return VirtualClose(entity, webm, HttpStatusCode.OK);
        }

        ///<inheritdoc/>
        protected override async ValueTask<VfReturnType> DeleteAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

            if (webm.Assert(entity.Session.CanDelete(), "You do not have permissions to delete records"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }
           
            if(!entity.QueryArgs.TryGetNonEmptyValue("id", out string? deleteId))
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

        sealed class BatchUploadResult
        {
            [JsonPropertyName("invalid")]
            public BookmarkError[]? Errors { get; set; }
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

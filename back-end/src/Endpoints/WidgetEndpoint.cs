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
using System.Threading.Tasks;
using System.Text;

using VNLib.Utils.IO;
using VNLib.Utils.Memory;
using VNLib.Utils.Logging;
using VNLib.Utils.Extensions;
using VNLib.Net.Http;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Essentials.Extensions;
using VNLib.Plugins.Extensions.Loading.Routing;

using SimpleBookmark.Model;
using SimpleBookmark.Model.Widget;

namespace SimpleBookmark.Endpoints
{
    [EndpointPath("{{path}}")]
    [EndpointLogName("widget-endpoint")]
    [ConfigurationName("widgets")]
    internal sealed class WidgetEndpoint(PluginBase plugin, IConfigScope config) : UnprotectedWebEndpoint
    {
        private readonly BookmarkStore bookmarks = plugin.GetOrCreateSingleton<BookmarkStore>();
        private readonly WidgetAuthManager authManager = plugin.GetOrCreateSingleton<WidgetAuthManager>();
        private readonly bool Enabled = config.GetValueOrDefault("enabled", false);
        private readonly string? CorsAclHeaerDomains = config.GetValueOrDefault<string?>("cors-urls", null);

        protected override async ValueTask<VfReturnType> GetAsync(HttpEntity entity)
        {
            if (!Enabled)
            {
                return VfReturnType.NotFound;
            }

            /* if (!await authManager.IsTokenValidAsync(entity))
             {
                 return VirtualClose(entity, HttpStatusCode.Unauthorized);
             }*/

            //Widgets might be loaded in an iframe, so we need to allow cross-site requests
            if (CorsAclHeaerDomains is not null && entity.Server.IsCrossSite())
            {
                entity.Server.Headers.Append("Access-Control-Allow-Origin", CorsAclHeaerDomains);
            }

            /*
             * For now this just returns bookmarks with the "favorite" tag
             * an assume the auth manager has set the session's user-id field
             */

            BookmarkEntry[] boomarks = await bookmarks.SearchBookmarksAsync(
                entity.Session.UserID,
                query: null,
                tags: ["favorite"],
                limit: 25,
                page: 1,
                entity.EventCancellation
            );

            //Output memory buffer
            VnMemoryStream output = new(32 * 1024, false);

            try
            {
                string baseUrl = entity.Server.RequestUri.GetLeftPart(UriPartial.Authority);

                CompileGlanceTemplate(baseUrl, output, boomarks);

                //Assign glance template
                entity.Server.Headers["Widget-Title"] = "Simple-Bookmark Widget";
                entity.Server.Headers["Widget-Content-Type"] = "html";

                return VirtualClose(entity, HttpStatusCode.OK, ContentType.Html, output);
            }
            catch(Exception ex)
            {
                output.Dispose();

                Log.Error(ex, "Failed to complie glance template");
                return VirtualClose(entity, HttpStatusCode.InternalServerError);
            }
        }

        private static void CompileGlanceTemplate(string hostUrl, VnMemoryStream vms, BookmarkEntry[] bookmarks)
        {
            using IMemoryHandle<char> buffer = MemoryUtil.SafeAlloc<char>(32 * 1024, false);

            ForwardOnlyWriter<char> writer = new(buffer.Span);

            writer.Append("<!DOCTYPE html>");
            writer.Append("<html>");
            writer.Append("<head>");
            writer.Append("<title>Simple-Bookmark Widget</title>");
            writer.Append("</head>");
            writer.Append("<body>");

            writer.Append("<p class='size-h3'>");
            writer.Append("<a class='bookmarks-link color-highlight size-h3' href='");
            writer.Append(hostUrl);
            writer.Append("'>Favorites:</a>");
            writer.Append("</p>");
            writer.Append("<hr class='margin-block-15'/>");

            //Start bookmarks list
            writer.Append("<ul class='list-horizontal-text'>");

            foreach (BookmarkEntry entry in bookmarks)
            {
                writer.Append("<li>");

                //Enable the built-in bookmarks link (makes it prettier)
                writer.Append("<a class='bookmarks-link color-highlight size-h4' href='");
                writer.Append(entry.Url);
                writer.Append("'>");
                writer.Append(entry.Name);

                writer.Append("</a>");
                writer.Append("</li>");
            }

            writer.Append("</ul>");

            //Close the document
            writer.Append("</body>");
            writer.Append("</html>");

            int byteCount = Encoding.UTF8.GetByteCount(writer.AsSpan());

            using (UnsafeMemoryHandle<byte> utf8Buffer = MemoryUtil.UnsafeAllocNearestPage(byteCount, true))
            {
                //Encode utf8 bytes
                Encoding.UTF8.GetBytes(writer.AsSpan(), utf8Buffer.Span);

                vms.Write(utf8Buffer.AsSpan(0, byteCount));
            }

            vms.Seek(0, System.IO.SeekOrigin.Begin);
        }
    }
}

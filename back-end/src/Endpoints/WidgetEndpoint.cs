W// Copyright (C) 2024 Vaughn Nugent
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

using System.Net;
using System.Threading.Tasks;

using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Essentials.Extensions;

using SimpleBookmark.Model;
using SimpleBookmark.Model.Widget;

namespace SimpleBookmark.Endpoints
{
    [ConfigurationName("widgets")]
    internal sealed class WidgetEndpoint : UnprotectedWebEndpoint
    {
        private readonly BookmarkStore bookmarks;
        private readonly WidgetAuthManager authManager;
        private readonly bool Enabled;
        private readonly string? CorsAclHeaerDomains;

        public WidgetEndpoint(PluginBase plugin, IConfigScope config)
        {
            string path = config.GetRequiredProperty("path", static p => p.GetString()!);
            InitPathAndLog(path, plugin.Log.CreateScope("widget-endpoint"));

            Enabled = config.GetValueOrDefault("enabled", static p => p.GetBoolean(), false);
            CorsAclHeaerDomains = config.GetValueOrDefault("cors-urls", static p => p.GetString(), null);

            bookmarks = plugin.GetOrCreateSingleton<BookmarkStore>();
            authManager = plugin.GetOrCreateSingleton<WidgetAuthManager>();
        }

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
            if(CorsAclHeaerDomains is not null && entity.Server.IsCrossSite())
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

            return VirtualCloseJson(entity, boomarks, HttpStatusCode.OK);
        }
    }
}

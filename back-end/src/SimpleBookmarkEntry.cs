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

/*
   * This class/file is the entrypoint for all VNLib.Plugins.Essentials
   * projects. It is dynamically loaded by the VNLib.Plugins.Runtime in a 
   * webserver environment. Some helper libraries are provided to make
   * development easier such as VNLib.Plugins.Extensions.Loading and
   * VNLib.Plugins.Extensions.Loading.Sql.
   */

using System;

using VNLib.Plugins;
using VNLib.Utils.Logging;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Loading.Sql;
using VNLib.Plugins.Extensions.Loading.Routing;

using SimpleBookmark.Model;
using SimpleBookmark.Endpoints;

namespace SimpleBookmark
{
  
    public sealed class SimpleBookmarkEntry : PluginBase
    {
        ///<inheritdoc/>
        public override string PluginName { get; } = "SimpleBookmark";

        ///<inheritdoc/>
        protected override void OnLoad()
        {
            //route the bm endpoint
            this.Route<BookmarkEndpoint>();

            //Ensure database is created after a delay
            this.ObserveWork(() => this.EnsureDbCreatedAsync<SimpleBookmarkContext>(this), 1000);

            Log.Information("Plugin loaded");
        }

        ///<inheritdoc/>
        protected override void OnUnLoad()
        {
            Log.Information("Plugin unloaded");
        }

        protected override void ProcessHostCommand(string cmd)
        {
            throw new NotImplementedException();
        }
    }
}

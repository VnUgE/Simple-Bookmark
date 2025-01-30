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
using VNLib.Plugins.Extensions.Loading.Routing.Mvc;

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
            this.Route<SiteLookupEndpoint>();

            //Ensure database is created after a delay
            this.ObserveWork(() => this.EnsureDbCreatedAsync<SimpleBookmarkContext>(this), 1500);

            Log.Information("Plugin Loaded");
            PrintHelloMessage();
        }

        ///<inheritdoc/>
        protected override void OnUnLoad()
        {
            Log.Information("Plugin unloaded");
        }

        protected override void ProcessHostCommand(string cmd)
        { }

        private void PrintHelloMessage()
        {
            const string template =
@"
******************************************************************************
    Simple-Bookmark - A linkding inspired, self hosted, bookmark manager 
    By Vaughn Nugent - vnpublic@proton.me
    https://www.vaughnnugent.com/resources/software
    License: GNU Affero General Public License v3.0
    This application comes with ABSOLUTELY NO WARRANTY.

    Documentation: https://www.vaughnnugent.com/resources/software/articles?tags=docs,_simple-bookmark
    GitHub: https://github.com/VnUgE/simple-bookmark
    {warning}

******************************************************************************";

           
            //See if setup mode is enabled
            bool setupMode = HostArgs.HasArgument("--setup") && !HostArgs.HasArgument("--disable-registation");

            string warnMessage = setupMode
                ? "\nWARNING: This server is in setup mode. Account registation is open to all users.\n"
                : string.Empty;

            Log.Information(template, warnMessage);
        }
    }
}

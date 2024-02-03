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


using VNLib.Plugins;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Data.Caching;
using VNLib.Plugins.Extensions.VNCache;
using VNLib.Plugins.Extensions.VNCache.DataModel;

namespace SimpleBookmark.Cache
{

    [ConfigurationName("settings")]
    internal sealed class UserSettingsStore
    {
        private readonly IEntityCache<UserSettings>? Cache;

        public UserSettingsStore(PluginBase plugin, IConfigScope config)
        {
            //try to get the global cache provider
            IGlobalCacheProvider? cache = plugin.GetDefaultGlobalCache();
            if (cache != null)
            {
                MemPackCacheSerializer serializer = new(null);

                //Recover the cache prefix
                string prefix = config.GetRequiredProperty("cache_prefix", p => p.GetString()!);

                //Create a prefixed cache, then create an entity cache for the user settings
                Cache = cache.GetPrefixedCache(prefix)
                    .CreateEntityCache<UserSettings>(serializer, serializer);
            }
        }
    }
}

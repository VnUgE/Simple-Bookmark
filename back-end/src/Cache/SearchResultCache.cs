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
using System.Threading;
using System.Threading.Tasks;

using VNLib.Net.Http;
using VNLib.Data.Caching;
using VNLib.Plugins;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.VNCache;
using VNLib.Plugins.Extensions.VNCache.DataModel;

namespace SimpleBookmark.Cache
{
    [ConfigurationName("search_cache", Required = false)]
    internal sealed class SearchResultCache
    {
        private readonly IEntityCache<ResultCacheEntry>? _cache;

        /// <summary>
        /// Gets a value that indicates if the configuration enabled result caching
        /// </summary>
        public bool IsEnabled => _cache != null;

        public SearchResultCache(PluginBase plugin) : this(plugin, null)
        { }

        public SearchResultCache(PluginBase plugin, IConfigScope? config)
        {
            string? cachePrefix = config?.GetRequiredProperty("cachePrefix", p => p.GetString()!);
            bool isEnabled = config?.GetRequiredProperty("enabled", p => p.GetBoolean()) ?? true;

            if (!isEnabled)
            {
                return;
            }

            IGlobalCacheProvider? cache = plugin.GetDefaultGlobalCache();
            if (cache != null)
            {
                if (cachePrefix != null)
                {
                    _cache = cache.GetPrefixedCache(cachePrefix)
                        .CreateEntityCache<ResultCacheEntry>(
                            new MemPackCacheSerializer(null),
                            new MemPackCacheSerializer(null)
                        );
                }
                else
                {
                    //non-prefixed cache
                    _cache = cache.CreateEntityCache<ResultCacheEntry>(
                        new MemPackCacheSerializer(null),
                        new MemPackCacheSerializer(null)
                    );
                }
            }
        }

        public async Task<IMemoryResponseReader?> GetCachedResultAsync(string[] keys, CancellationToken cancellation)
        {
            ResultCacheEntry? entry = await _cache!.GetAsync($"{keys}", cancellation);
            return entry is null ? null : new ResultResponseReader(entry);
        }

        public Task StoreResultAsync(Memory<byte> data, string[] keys, CancellationToken cancellation)
        {
            //Init new entry
            ResultCacheEntry entry = new()
            {
                Payload = data,
                Created = DateTime.UtcNow
            };

            return _cache!.UpsertAsync($"{keys}", entry, cancellation);
        }

        public Task DeleteEntry(string[] keys, CancellationToken cancellation) => _cache!.RemoveAsync($"{keys}", cancellation);

        private sealed class ResultResponseReader(ResultCacheEntry entry) : IMemoryResponseReader
        {
            private int _position;

            ///<inheritdoc/>
            public int Remaining => entry.Payload.Length - _position;

            ///<inheritdoc/>
            public void Advance(int written) => _position += written;

            ///<inheritdoc/>
            public void Close() => entry.Dispose();

            ///<inheritdoc/>
            public ReadOnlyMemory<byte> GetMemory() => entry.Payload.Slice(_position);
        }
    }
}

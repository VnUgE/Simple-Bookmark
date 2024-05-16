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
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using VNLib.Utils;
using VNLib.Utils.Extensions;
using VNLib.Plugins;
using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Data.Abstractions;
using VNLib.Plugins.Extensions.Loading.Sql;
using VNLib.Plugins.Extensions.Data.Extensions;

namespace SimpleBookmark.Model.WebHistory
{
    internal sealed class WebHistoryStore(PluginBase plugin) : DbStore<WebHistoryEntry>
    {
        private readonly IAsyncLazy<DbContextOptions> dbOptions = plugin.GetContextOptionsAsync();

        ///<inheritdoc/>
        public override IDbQueryLookup<WebHistoryEntry> QueryTable { get; } = new WebHistoryQueryTable();

        ///<inheritdoc/>
        public override IDbContextHandle GetNewContext() => new SimpleBookmarkContext(dbOptions.Value);

        ///<inheritdoc/>
        public override string GetNewRecordId() => Guid.NewGuid().ToString("n");

        public override void OnRecordUpdate(WebHistoryEntry newRecord, WebHistoryEntry existing)
        {
            //Update existing record
            existing.Title = newRecord.Title;
            existing.Url = newRecord.Url;
        }

        public async Task<ERRNO> UpsertMultipleAsync(string userId, WebHistoryEntry[] entries, CancellationToken cancellation)
        {
            DateTime now = DateTime.UtcNow;

           /*
            * Update the required entry data before entering into the DB. 
            * This includes forcing userid, new event IDs, and updating
            * created and last modified times to the current time.
            */

            entries.WithTime(now, true)
                .WithUserId(userId)
                .ForEach(e => e.Id = GetNewRecordId());

            string[] urls = entries.Select(e => e.Url!)
                .Distinct()
                .ToArray();

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            WebHistoryEntry[] existing = await context.Set<WebHistoryEntry>()
                .Where(b => b.UserId == userId)
                .Where(b => urls.Contains(b.Url))
                .ToArrayAsync(cancellation);

          
            //Update last modified time for existing entires
            existing.ForEach(e => e.LastModified = now);

            context.Set<WebHistoryEntry>()
                .AddRange(entries.IntersectBy(existing, p => p.Url));
        }

        public Task<ERRNO> DeleteAllForUserAsync(string userId, CancellationToken cancellation)
        {
            return DeleteAfterAsync(userId, DateTime.MaxValue, cancellation);
        }

        public async Task<ERRNO> DeleteAfterAsync(string userId, DateTime afterTime, CancellationToken cancellation)
        {
            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            WebHistoryEntry[] entities = await context.Set<WebHistoryEntry>()
                .Where(b => b.UserId == userId)
                .Where(b => b.LastModified > afterTime)
                .ToArrayAsync(cancellation);

            context.RemoveRange(entities);

            await context.SaveAndCloseAsync(true, cancellation);

            return entities.Length;
        }

        public async Task<ERRNO> DeleteAllAsync(string userId, string[] eventIds, CancellationToken cancellation)
        {
            //Remove duplicates and empty strings
            eventIds = eventIds.Where(e => !string.IsNullOrWhiteSpace(e))
                        .Distinct()
                        .ToArray();

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            WebHistoryEntry[] entities = await context.Set<WebHistoryEntry>()
                .Where(b => b.UserId == userId)
                .Where(b => eventIds.Contains(b.Id))
                .ToArrayAsync(cancellation);

            context.RemoveRange(entities);

            await context.SaveAndCloseAsync(true, cancellation);

            return entities.Length;
        }

        private sealed class WebHistoryQueryTable : IDbQueryLookup<WebHistoryEntry>
        {
            public IQueryable<WebHistoryEntry> GetCollectionQueryBuilder(IDbContextHandle context, params string[] constraints)
            {
                string userId = constraints[0];

                return from b in context.Set<WebHistoryEntry>()
                       where b.UserId == userId
                       orderby b.Created descending
                       select b;
            }

            public IQueryable<WebHistoryEntry> GetSingleQueryBuilder(IDbContextHandle context, params string[] constraints)
            {
                string eventId = constraints[0];
                string userId = constraints[1];

                return from b in context.Set<WebHistoryEntry>()
                       where b.UserId == userId && b.Id == eventId
                       select b;
            }
        }

    }
}

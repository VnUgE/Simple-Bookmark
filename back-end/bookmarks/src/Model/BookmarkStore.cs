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

using Microsoft.EntityFrameworkCore;

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

using VNLib.Utils;
using VNLib.Plugins;
using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Data.Abstractions;
using VNLib.Plugins.Extensions.Loading.Sql;

namespace SimpleBookmark.Model
{
    internal sealed class BookmarkStore(PluginBase plugin) : DbStore<BookmarkEntry>
    {
        private readonly IAsyncLazy<DbContextOptions> dbOptions = plugin.GetContextOptionsAsync();

        ///<inheritdoc/>
        public override IDbQueryLookup<BookmarkEntry> QueryTable { get; } = new BookmarkQueryLookup();

        ///<inheritdoc/>
        public override IDbContextHandle GetNewContext() => new SimpleBookmarkContext(dbOptions.Value);

        ///<inheritdoc/>
        public override string GetNewRecordId() => Guid.NewGuid().ToString("n");

        ///<inheritdoc/>
        public override void OnRecordUpdate(BookmarkEntry newRecord, BookmarkEntry existing)
        {
            //Update existing record
            existing.Name = newRecord.Name;
            existing.Url = newRecord.Url;
            existing.Description = newRecord.Description;
            existing.JsonTags = newRecord.JsonTags;
        }
     
        public async Task<int> AddSingleIfNotExists(string userId, BookmarkEntry entry, DateTime now, uint maxRecords, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);
            ArgumentNullException.ThrowIfNull(entry);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            //Check if any bookmarks exist for the user with a given url
            bool exists = await context.Bookmarks.AnyAsync(b => b.UserId == userId && b.Url == entry.Url, cancellation);

            //If no bookmarks exist, add a new one
            if (!exists)
            {
                //Check if the user has reached the maximum number of bookmarks
                if (await context.Bookmarks.CountAsync(b => b.UserId == userId, cancellation) >= maxRecords)
                {
                    await context.SaveAndCloseAsync(true, cancellation);
                    return -1;
                }

                context.Bookmarks.Add(new BookmarkEntry
                {
                    Id              = GetNewRecordId(),      //Overwrite with new record id
                    UserId          = userId,            //Enforce user id
                    Created         = now,
                    LastModified    = now,
                    Name            = entry.Name,          //Copy over the entry data
                    Url             = entry.Url,
                    Description     = entry.Description,
                    Tags            = entry.Tags
                });
            }

            await context.SaveAndCloseAsync(commit: true, cancellation);
            return exists ? 0 : 1;         //1 if added, 0 if already exists
        }

        public async Task<BookmarkEntry[]> SearchBookmarksAsync(string userId, string? query, string[] tags, int limit, int page, CancellationToken cancellation)
        {
            BookmarkEntry[] results;

            ArgumentNullException.ThrowIfNull(userId);
            ArgumentNullException.ThrowIfNull(tags);
            ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(limit, 0);
            ArgumentOutOfRangeException.ThrowIfNegative(page);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            //Build the query starting with the user's bookmarks
            IQueryable<BookmarkEntry> q = context.Bookmarks.Where(b => b.UserId == userId);

            //reduce result set by search query first
            if (!string.IsNullOrWhiteSpace(query))
            {               
                q = WithSearch(q, query);
            }
            
            q = q.OrderByDescending(static b => b.Created);

            /*
              *  For some databases server-side tag filtering is not supported.
              *  Client side evaluation must be used to finally filter the results.
              *  
              *  I am attempting to reduce the result set as much as possible on server-side
              *  evaluation before pulling the results into memory. So search, ordering and
              *  first tag filtering is done on server-side. The final tag filtering is done
              *  for multiple tags on client-side along with pagination. For bookmarks, I expect
              *  the result set to at worst double digits for most users, so this should be fine.
              *  
              */

            if (tags.Length > 0)
            {
             
                //filter out bookmarks that do not have any tags and reduce by the first tag
                q = q.Where(static b => b.Tags != null && b.Tags.Length > 0)
                    .Where(b => EF.Functions.Like(b.Tags, $"%{tags[0]}%"));
            }

            if(tags.Length > 1)
            {
                //Finally pull all results into memory
                BookmarkEntry[] bookmarkEntries = await q.ToArrayAsync(cancellation);

                //filter out bookmarks that do not have all requested tags, then skip and take the requested page
                results = bookmarkEntries
                    .Where(b => tags.All(p => b.JsonTags!.Contains(p)))
                    .Skip(page * limit)
                    .Take(limit)
                    .ToArray();
            }
            else
            {
                //execute server-side query
                results = await q
                    .Skip(page * limit)
                    .Take(limit)
                    .ToArrayAsync(cancellation);               
            }           

            //Close db and commit transaction
            await context.SaveAndCloseAsync(commit: true, cancellation);

            return results;
        }

        private static IQueryable<BookmarkEntry> WithSearch(IQueryable<BookmarkEntry> q, string query)
        {
            //if query is set, only return bookmarks that match the query
            return q.Where(b => EF.Functions.Like(b.Name, $"%{query}%") || EF.Functions.Like(b.Description, $"%{query}%"));
        }

        public async Task<string[]> GetAllTagsForUserAsync(string userId, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            
            //Get all tags for the user
            string[] tags = await context.Bookmarks
                .Where(b => b.UserId == userId)
                .Select(static b => b.Tags!)
                .ToArrayAsync(cancellation);

            //Close db and commit transaction
            await context.SaveAndCloseAsync(true, cancellation);

            //Split tags into individual strings
            return tags
                .Where(static t => !string.IsNullOrWhiteSpace(t))
                .SelectMany(static t => t!.Split(','))
                .Distinct()
                .ToArray();
        }

        public async Task<ERRNO> DeleteAllForUserAsync(string userId, CancellationToken cancellation)
        {
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            context.Bookmarks.RemoveRange(context.Bookmarks.Where(b => b.UserId == userId));

            return await context.SaveAndCloseAsync(commit: true, cancellation);
        }

        public async Task<ERRNO> AddBulkAsync(IEnumerable<BookmarkEntry> bookmarks, string userId, DateTimeOffset now, CancellationToken cancellation)
        {
            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);

            //Setup clean bookmark instances
            bookmarks = bookmarks.Select(b => new BookmarkEntry
            {
                Id              = GetNewRecordId(),  //new uuid
                UserId          = userId,        //Set userid
                LastModified    = now.DateTime,

                //Allow reuse of created time
                Created         = b.Created,
                Description     = b.Description,
                Name            = b.Name,
                Tags            = b.Tags,
                Url             = b.Url,
            });

            //Filter out bookmarks that already exist
            bookmarks = bookmarks.Where(b => !context.Bookmarks.Any(b2 => b2.UserId == userId && b2.Url == b.Url));

            //Add bookmarks to db
            context.AddRange(bookmarks);

            //Commit transaction
            return await context.SaveAndCloseAsync(true, cancellation);
        }

        private sealed class BookmarkQueryLookup : IDbQueryLookup<BookmarkEntry>
        {
            public IQueryable<BookmarkEntry> GetCollectionQueryBuilder(IDbContextHandle context, params string[] constraints)
            {
                string userId = constraints[0];

                return from b in context.Set<BookmarkEntry>()
                       where b.UserId == userId
                       orderby b.Created descending
                       select b;
            }

            public IQueryable<BookmarkEntry> GetSingleQueryBuilder(IDbContextHandle context, params string[] constraints)
            {
                string bookmarkId = constraints[0];
                string userId = constraints[1];               

                return from b in context.Set<BookmarkEntry>()
                       where b.UserId == userId && b.Id == bookmarkId
                       select b;
            }
        }
    }
}

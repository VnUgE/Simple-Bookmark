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
using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Data.Abstractions;


namespace SimpleBookmark.Model
{
    internal sealed class BookmarkStore(IAsyncLazy<DbContextOptions> dbOptions) : DbStore<BookmarkEntry>
    {
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

        public async Task<BookmarkEntry[]> SearchBookmarksAsync(string userId, string? query, string[] tags, int limit, int page, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);
            ArgumentNullException.ThrowIfNull(tags);
            ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(limit, 0);
            ArgumentOutOfRangeException.ThrowIfNegative(page);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            await context.OpenTransactionAsync(cancellation);

            //Start with userid 
            IQueryable<BookmarkEntry> q = context.Bookmarks.Where(b => b.UserId == userId);

            if (tags.Length > 0)
            {
                //if tags are set, only return bookmarks that match the tags
                q = q.Where(b => b.Tags != null && tags.All(t => b.Tags!.Contains(t)));
            }

            if (!string.IsNullOrWhiteSpace(query))
            {
                //if query is set, only return bookmarks that match the query
                q = q.Where(b => EF.Functions.Like(b.Name, $"%{query}%") || EF.Functions.Like(b.Description, $"%{query}%"));
            }

            //return bookmarks in descending order of creation
            q = q.OrderByDescending(static b => b.Created);

            //return only the requested page
            q = q.Skip(page * limit).Take(limit);

            //execute query
            BookmarkEntry[] results = await q.ToArrayAsync(cancellation);

            //Close db and commit transaction
            await context.SaveAndCloseAsync(true, cancellation);

            return results;
        }

        public async Task<string[]> GetAllTagsForUserAsync(string userId, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            await context.OpenTransactionAsync(cancellation);

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

        public async Task<ERRNO> AddBulkAsync(IEnumerable<BookmarkEntry> bookmarks, string userId, DateTimeOffset now, CancellationToken cancellation)
        {
            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            await context.OpenTransactionAsync(cancellation);

            //Setup clean bookmark instances
            bookmarks = bookmarks.Select(b => new BookmarkEntry
            {
                Id = GetNewRecordId(),  //new uuid
                UserId = userId,        //Set userid
                LastModified = now.DateTime,

                //Allow reuse of created time
                Created = b.Created,
                Description = b.Description,
                Name = b.Name,
                Tags = b.Tags,
                Url = b.Url,
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

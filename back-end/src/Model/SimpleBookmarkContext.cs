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

using SimpleBookmark.Model.WebHistory;

using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Loading.Sql;


namespace SimpleBookmark.Model
{

    internal sealed class SimpleBookmarkContext : DBContextBase, IDbTableDefinition
    {

        public DbSet<BookmarkEntry> Bookmarks { get; set; }

        public DbSet<WebHistoryEntry> WebHistory { get; set; }

        public DbSet<WebExtensionAuth> AuthorizedExtensions { get; set; }

        public SimpleBookmarkContext(DbContextOptions options) : base(options)
        { }

        public SimpleBookmarkContext() : base()
        { }

        public void OnDatabaseCreating(IDbContextBuilder builder, object? userState)
        {
            /*
             * Define the coloumn mappings for the BookmarkEntry table
             */
            builder.DefineTable<BookmarkEntry>(nameof(Bookmarks), table =>
            {
                table.WithColumn(p => p.Id).AllowNull(false);
                table.WithColumn(p => p.Created);
                table.WithColumn(p => p.LastModified);
                table.WithColumn(p => p.UserId).AllowNull(false);
                table.WithColumn(p => p.Name);
                table.WithColumn(p => p.Version);
                table.WithColumn(p => p.Url);
                table.WithColumn(p => p.Description);
                table.WithColumn(p => p.Tags);
            });

            /*
             * Define the coloumn mappings for the WebHistoryEntry table                       
             */
            builder.DefineTable<WebHistoryEntry>(nameof(WebHistory), table =>
            {
                table.WithColumn(p => p.Id).AllowNull(false);
                table.WithColumn(p => p.Created);
                table.WithColumn(p => p.LastModified);
                table.WithColumn(p => p.UserId).AllowNull(false);
                table.WithColumn(p => p.Title);
                table.WithColumn(p => p.Url).AllowNull(false);
            });

            /*
             * Define the coloumn mappings for the authorized extensions table
             */
            builder.DefineTable<WebExtensionAuth>(nameof(AuthorizedExtensions), table =>
            {
                table.WithColumn(p => p.Id).AllowNull(false);
                table.WithColumn(p => p.Created);
                table.WithColumn(p => p.LastModified);
                table.WithColumn(p => p.UserId).AllowNull(false);
                table.WithColumn(p => p.ExtensionId).AllowNull(false);
                table.WithColumn(p => p.PublicKey).AllowNull(false);
                table.WithColumn(p => p.AdditionalData);
            });
        }

    }
}

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

using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Loading.Sql;


namespace SimpleBookmark.Model
{

    internal sealed class SimpleBookmarkContext : DBContextBase, IDbTableDefinition
    {

        public DbSet<BookmarkEntry> Bookmarks { get; set; }

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
        }

    }
}

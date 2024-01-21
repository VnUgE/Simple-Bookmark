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

    internal sealed class SimpleBookmarkContext : TransactionalDbContext, IDbTableDefinition
    {

        public DbSet<BookmarkEntry> Bookmarks { get; set; }

        public DbSet<UserSettingsEntry> BmSettings { get; set; }

        public SimpleBookmarkContext(DbContextOptions options) : base(options)
        { }

        public SimpleBookmarkContext() : base()
        { }

        public void OnDatabaseCreating(IDbContextBuilder builder, object? userState)
        {
            builder.DefineTable<BookmarkEntry>(nameof(Bookmarks))
                    .WithColumn(p => p.Id)
                    .SetIsKey()
                    .Next()

                .WithColumn(p => p.Created)
                    .AllowNull(false)
                    .Next()

                .WithColumn(p => p.LastModified)
                    .AllowNull(false)
                    .Next()

                .WithColumn(p => p.UserId)
                    .AllowNull(false)
                    .Next()

                .WithColumn(p => p.Name)
                    .AllowNull(true)
                    .MaxLength(100)
                    .Next()

                .WithColumn(p => p.Url)
                    .AllowNull(true)
                    .Next()

                .WithColumn(p => p.Description)
                    .AllowNull(true)
                    .MaxLength(500)
                    .Next()

                .WithColumn(p => p.Tags)
                    .AllowNull(true)
                    .MaxLength(100)
                    .Next();
        }

    }
}

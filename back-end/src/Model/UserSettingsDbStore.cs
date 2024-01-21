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

using Microsoft.EntityFrameworkCore;

using VNLib.Utils;
using VNLib.Plugins.Extensions.Loading;

namespace SimpleBookmark.Model
{
    internal sealed class UserSettingsDbStore(IAsyncLazy<DbContextOptions> dbOptions) 
    {
        
        public async Task<UserSettingsEntry?> GetSettingsForUserAsync(string userId, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            await context.OpenTransactionAsync(cancellation);

            UserSettingsEntry? settings = await context.BmSettings.FirstOrDefaultAsync(p => p.UserId == userId, cancellation);

            //Close db and commit transaction
            await context.SaveAndCloseAsync(true, cancellation);

            return settings;
        }
        
        public async Task<ERRNO> SetSettingsForUser(string userId, UserSettingsEntry settings, CancellationToken cancellation)
        {
            ArgumentNullException.ThrowIfNull(userId);
            ArgumentNullException.ThrowIfNull(settings);

            //Init new db connection
            await using SimpleBookmarkContext context = new(dbOptions.Value);
            await context.OpenTransactionAsync(cancellation);

            //Search for existing settings entry
            UserSettingsEntry? existing = await context.BmSettings.FirstOrDefaultAsync(p => p.UserId == userId, cancellation);

            if (existing is null)
            {
                //Add a new entry
                settings.UserId = userId;
                settings.LastModified = DateTime.UtcNow;
                context.Add(settings);
            }
            else
            {
                //Update existing entry
                existing.SettingsData = settings.SettingsData;
                existing.LastModified = DateTime.UtcNow;
                context.Update(existing);
            }

            //Close db and commit transaction
            return await context.SaveAndCloseAsync(true, cancellation);
        }
    }
}

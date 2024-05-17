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
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

using VNLib.Hashing;
using VNLib.Hashing.IdentityUtility;
using VNLib.Utils;
using VNLib.Utils.Extensions;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Sessions;
using VNLib.Plugins.Essentials.Users;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Loading.Users;
using VNLib.Plugins.Essentials.Extensions;

namespace SimpleBookmark.Model.Widget
{
    [ConfigurationName("widgets")]
    internal sealed class WidgetAuthManager(PluginBase plugin, IConfigScope config)
    {
        /*
         * This auth manager attempts to cache auth data by storing user-related data in 
         * the session, instead of hitting the database on every request. This is done to
         * reduce the number of database queries and improve performance.
         */

        const string AuthTokenQueryArgName = "t";
        const string TimestampKey = "sb.w.ts";
        const string SignatureKey = "sb.w.sig";
        const string UserSigningKeyKey = "sb.w.usk";

        private static readonly TimeSpan _authCacheValidFor = TimeSpan.FromMinutes(25);

        private readonly IUserManager users = plugin.GetOrCreateSingleton<UserManager>();

        private readonly int SigningKeySize = config.GetValueOrDefault("key_size", static p => p.GetInt32(), 16);

        public async ValueTask<bool> IsTokenValidAsync(HttpEntity entity)
        {
            string? token = GetTokenString(entity);

            if (string.IsNullOrWhiteSpace(token))
            {
                //No token provided
                return false;
            }

            if (HasExistingAuth(entity, token))
            {
                return true;
            }

            return await AuthorizeSession(entity, token);
        }

        private static bool HasExistingAuth(HttpEntity entity, string token)
        {
            //New sessions cannot be trusted yet
            if (entity.Session.IsNew)
            {
                return false;
            }

            /*
             * See if existing auth data exists in the session
             */
            DateTimeOffset expires = GetTimestamp(in entity.Session);

            if (expires < entity.RequestedTimeUtc)
            {
                return false;
            }

            string cachedToken = GetCachedToken(in entity.Session);

            return string.Equals(cachedToken, token, StringComparison.Ordinal);
        }

        private async Task<bool> AuthorizeSession(HttpEntity entity, string token)
        {
            try
            {
                using JsonWebToken jwt = JsonWebToken.Parse(token);
                using JsonDocument jwtData = jwt.GetPayload();

                string? userId = jwtData.RootElement.GetPropString("sub");

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return false;
                }

                using IUser? user = await users.GetUserFromIDAsync(userId, entity.EventCancellation);

                return false;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        public void GenerateWidgetKey(IUser user)
        {
            /*
             * A base32 number ensures easy serialization by the user-system
             * instead of base64 which can cause json overhead
             */
            user[UserSigningKeyKey] = RandomHash.GetRandomBase32(SigningKeySize);
        }

        /// <summary>
        /// Gets a value that indicates if the user has a widget signing key enabled
        /// </summary>
        /// <param name="user">The user instance to verify</param>
        /// <returns>True if the user has a widget signing key enabled</returns>
        public static bool HasSigningKey(IUser user) => !string.IsNullOrEmpty(user[UserSigningKeyKey]);

        private static DateTimeOffset GetTimestamp(ref readonly SessionInfo session)
        {
            long timestamp = VnEncoding.FromBase32String<long>(session[TimestampKey]);
            return DateTimeOffset.FromUnixTimeSeconds(timestamp);
        }

        private static void SetTimestamp(ref readonly SessionInfo session, DateTimeOffset timestamp)
            => session[TimestampKey] = VnEncoding.ToBase32String(timestamp.ToUnixTimeSeconds());

        private static string GetCachedToken(ref readonly SessionInfo session) => session[SignatureKey];

        private static void SetSignature(ref readonly SessionInfo session, string signature) => session[SignatureKey] = signature;

        private static string? GetTokenString(HttpEntity entity) => entity.QueryArgs.GetValueOrDefault(AuthTokenQueryArgName);

    }
}

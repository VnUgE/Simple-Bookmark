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

using VNLib.Plugins.Essentials.Accounts;
using VNLib.Plugins.Essentials.Users;
using VNLib.Plugins.Essentials.Sessions;

namespace SimpleBookmark.Admin
{
    internal static class RoleHelpers
    {
        public const ulong CanAddUserRoleOption = 1 << AccountUtil.OPTIONS_MSK_OFFSET;

        /// <summary>
        /// A minium user role with read/write/delete access to their own bookmarks.
        /// </summary>
        public const ulong MinUserRole = AccountUtil.MINIMUM_LEVEL | AccountUtil.ALLFILE_MSK;

        public static bool CanAddUser(this IUser user) => (user.Privileges & CanAddUserRoleOption) != 0;

        public static bool CanAddUser(this ref readonly SessionInfo session) => (session.Privilages & CanAddUserRoleOption) != 0;

        /// <summary>
        /// Adds the add-user role to the given privileges for a user.
        /// </summary>
        /// <param name="privs"></param>
        /// <returns>The modified privilege level</returns>
        public static ulong WithAddUserRole(ulong privs) => privs | CanAddUserRoleOption;
    }
}

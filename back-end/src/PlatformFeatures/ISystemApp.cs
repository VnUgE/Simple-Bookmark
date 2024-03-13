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


using System.Threading.Tasks;
using System.Threading;

namespace SimpleBookmark.PlatformFeatures
{
    internal interface ISystemApp
    {
        /// <summary>
        /// Gets a value indicating if the curl application is available 
        /// on the local system.
        /// </summary>
        /// <returns>True if the curl exe is available on the local system, false otherwise</returns>
        Task<bool> TestIsAvailable(CancellationToken cancellation);
    }
}

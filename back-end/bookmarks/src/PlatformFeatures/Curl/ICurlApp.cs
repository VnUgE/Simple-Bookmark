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

namespace SimpleBookmark.PlatformFeatures.Curl
{
    internal interface ICurlApp
    {
        /// <summary>
        /// Executes a lookup on the given website and returns the title and description
        /// </summary>
        /// <param name="website">The website url to search against</param>
        /// <param name="cancellation">A token to cancel the operation</param>
        /// <returns>The result of the website lookup</returns>
        Task<CurlResult> ExecLookupAsync(Uri website, int? timeoutMs, CancellationToken cancellation);
    }
}

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

using System.Text.Json.Serialization;


namespace SimpleBookmark.Model
{
    internal sealed class BookmarkStoreConfig
    {
        /// <summary>
        /// The maximum number of results that can be returned 
        /// in a single query.
        /// </summary>
        [JsonPropertyName("max_limit")]
        public uint MaxLimit { get; set; } = 100;

        /// <summary>
        /// The default number of results that will be returned in a single query.
        /// </summary>
        [JsonPropertyName("default_limit")]
        public uint DefaultLimit { get; set; } = 10;

        /// <summary>
        /// The maximum number of bookmarks that can be stored per user account.
        /// </summary>
        [JsonPropertyName("user_quota")]
        public uint PerPersonQuota { get; set; } = 5000;
    }
}

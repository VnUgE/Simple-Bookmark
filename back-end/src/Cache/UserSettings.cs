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

using MemoryPack;

namespace SimpleBookmark.Cache
{
    [MemoryPackable]
    internal sealed partial class UserSettings
    {
        [JsonPropertyName("limit")]
        public uint PreferredLimit { get; set; } = 10;

        [JsonPropertyName("new_tab")]
        public bool OpenInNewTab { get; set; } = true;

        [JsonPropertyName("dark_mode")]
        public bool DarkMode { get; set; } = false;
    }
}

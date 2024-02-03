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
using System.Buffers;
using System.Runtime.InteropServices;
using System.Text.Json.Serialization;

using MemoryPack;

namespace SimpleBookmark.Cache
{
    [MemoryPackable]
    internal partial class ResultCacheEntry : IDisposable
    {       
        [MemoryPoolFormatter<byte>]
        public Memory<byte> Payload { get; set; }

        [JsonPropertyName("created")]
        public DateTime Created { get; set; }

        public void Dispose()
        {
            //Return the array back to the pool
            if (MemoryMarshal.TryGetArray(Payload, out ArraySegment<byte> segment) && segment.Array is { Length: > 0 })
            {
                ArrayPool<byte>.Shared.Return(segment.Array);
                Payload = default;
            }
        }
    }
}

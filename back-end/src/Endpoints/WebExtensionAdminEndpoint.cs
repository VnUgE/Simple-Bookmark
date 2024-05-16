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

using System.Net;
using System.Threading.Tasks;

using VNLib.Net.Http;
using VNLib.Utils.IO;
using VNLib.Utils.Memory;
using VNLib.Utils.Extensions;
using VNLib.Hashing.IdentityUtility;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Validation;

/*
 * This endpoint is used by web clients to manage their web extensions and control 
 * authorization and access to the extension. 
 */

namespace SimpleBookmark.Endpoints
{
    [ConfigurationName("extension_endpoint")]
    internal sealed class WebExtensionAdminEndpoint : ProtectedWebEndpoint
    {
        public WebExtensionAdminEndpoint(PluginBase plugin, IConfigScope config)
        {
            string path = config.GetRequiredProperty("path", p => p.GetString()!);
            InitPathAndLog(path, plugin.Log.CreateScope("Extension-Admin"));


        }


        protected override async ValueTask<VfReturnType> PutAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

            if (webm.Assert(entity.Files.Count == 1, "Invalid number of files uploaded"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            FileUpload upload = entity.Files[0];

            if(webm.Assert(upload.Length < 1000, "Key data is too large to be valid"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            using VnMemoryStream keyData = await BufferInputAsync(entity);

            //Parse the stream data as a json web key with some extra data
            ReadOnlyJsonWebKey jwk = ReadOnlyJsonWebKey.FromUtf8Bytes(keyData.AsSpan());

            
        }

        private static async Task<VnMemoryStream> BufferInputAsync(HttpEntity entity)
        {
            FileUpload upload = entity.Files[0];

            //Preallocate memory for the upload
            VnMemoryStream mem = new(MemoryUtil.Shared, (nuint)upload.Length, false);
            try
            {
                //Copy the entity file data into the memory stream
                await upload.FileData.CopyToAsync(mem, 4096, MemoryUtil.Shared, entity.EventCancellation);
            }
            catch
            {
                mem.Dispose();
                throw;
            }

            return mem;
        }
    }
}

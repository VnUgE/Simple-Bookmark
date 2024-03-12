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
using System.Net;
using System.Text;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

using VNLib.Utils;
using VNLib.Utils.Memory;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Essentials.Extensions;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Validation;

using SimpleBookmark.PlatformFeatures.Curl;

namespace SimpleBookmark.Endpoints
{
    [ConfigurationName("curl")]
    internal sealed class SiteLookupEndpoint : ProtectedWebEndpoint
    {
        const string DefaultCurlExecName = "curl";
        const int MaxTimeoutValue = 30000;

        private readonly SystemCurlApp _curl;
        private readonly IAsyncLazy<bool> _isSupported;

        public SiteLookupEndpoint(PluginBase plugin, IConfigScope config)
        {
            string path = config.GetRequiredProperty("path", p => p.GetString()!);
            InitPathAndLog(path, plugin.Log);

            string exePath = config.GetValueOrDefault("exe_path", p => p.GetString(), DefaultCurlExecName);
            bool httspOnly = config.GetValueOrDefault("https_only", p => p.GetBoolean(), false);
            
            //Optional extra arguments
            string[] extrArgs = config.GetValueOrDefault(
                "extra_args", 
                p => p.EnumerateArray().Select(s => s.GetString()!).ToArray(), 
                Array.Empty<string>()
            );

            _curl = new SystemCurlApp(exePath, httspOnly, extrArgs);

            //Immediately check if curl is supported
            _isSupported = _curl.TestIsAvailable(plugin.UnloadToken).AsLazy();
        }

        protected override async ValueTask<VfReturnType> GetAsync(HttpEntity entity)
        {
            WebMessage webm = new();

            bool isEnabled = await _isSupported;

            //Allow site to cache if curl is supported on the platform
            if (entity.QueryArgs.ContainsKey("support"))
            {
                webm.Success = isEnabled;
                return VirtualOk(entity, webm);
            }

            //Assert supported value as curl is required for a normal url lookup
            if(webm.Assert(isEnabled, "Curl is not supported on the current platform"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.NotImplemented);
            }

            string? url = entity.QueryArgs.GetValueOrDefault("url");

            if(webm.Assert(!string.IsNullOrWhiteSpace(url), "No url provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            if(webm.Assert(UrlFromBase64Url(url!, out Uri? uri), "Invalid url provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
            }

            int? timeoutMs = null;

            //Allow clients to specify a timeout for the request
            string? timeoutMsS = entity.QueryArgs.GetValueOrDefault("timeout");
            if (timeoutMsS is not null && int.TryParse(timeoutMsS, out int _timeoutMs))
            {
                //Miniumum timeout must be greater than 1 second because curl is timed in seconds
                timeoutMs = Math.Clamp(_timeoutMs, 1000, MaxTimeoutValue);
            }

            try
            {
                //Exec curl on the url
                CurlResult result = await _curl.ExecLookupAsync(uri!, timeoutMs, entity.EventCancellation);

                if(webm.Assert(result.IsError == false, result.ErrorMessage!))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.InternalServerError);
                }

                webm.Success = true;
                webm.Result = result.Result;    //Set curl lookup result as the response

                return VirtualOk(entity, webm);
            }
            catch (TimeoutException)
            {
                webm.Result = "Request timed out";
                return VirtualClose(entity, webm, HttpStatusCode.InternalServerError);
            }
            catch (OperationCanceledException)
            {
                webm.Result = "Request timed out";
                return VirtualClose(entity, webm, HttpStatusCode.InternalServerError);
            }
        }

        /*
         * Reads in a base64url encoded string which is the user's search url and
         * attempts to parse it into a uri. If the url is invalid, the function
         */
        private static bool UrlFromBase64Url(string base64Url, out Uri? uri)
        {
            uri = null;

            //Alloc output buffer for decoded data
            using UnsafeMemoryHandle<byte> output = MemoryUtil.UnsafeAllocNearestPage(base64Url.Length, true);

            ERRNO decoded  = VnEncoding.Base64UrlDecode(base64Url, output.Span, Encoding.UTF8);
            if(decoded < 1)
            {
                return false;
            }

            //Recover the url string from its binary representation and try to parse it into a uri
            string urlstring = Encoding.UTF8.GetString(output.Span[..(int)decoded]);
            return Uri.TryCreate(urlstring, UriKind.Absolute, out uri);
        }
    }
}

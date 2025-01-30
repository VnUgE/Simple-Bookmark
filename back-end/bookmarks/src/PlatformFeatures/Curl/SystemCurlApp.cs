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
using System.IO;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;

using VNLib.Utils.Memory;
using VNLib.Utils.Extensions;

namespace SimpleBookmark.PlatformFeatures.Curl
{
    sealed class SystemCurlApp(string exePath, bool httpsOnly, string[] additionalArgs) : ISystemApp, ICurlApp
    {
        const int DefaultTimeoutMs = 5000;

        ///<inheritdoc/>
        public async Task<bool> TestIsAvailable(CancellationToken cancellation)
        {
            try
            {
                //Test if the curl application is available on the local system, may be at path
                using Process? process = Exec(["--version"]);

                if (process is null)
                {
                    return false;
                }

                //Wait for the process to exit
                await process.WaitForExitAsync(cancellation);

                //If an ok status code, then we know the curl application is available
                return process.ExitCode == 0;
            }
            //App not found
            catch (Win32Exception)
            {
                return false;
            }
        }

        private Process? Exec(string[] arguments)
        {
            ProcessStartInfo startInfo = new()
            {
                FileName = exePath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,  
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            //Add arguments
            arguments.ForEach(startInfo.ArgumentList.Add);

            return Process.Start(startInfo);
        }

        private void ValidateUrl(Uri? website)
        {
            ArgumentNullException.ThrowIfNull(website);

            if (!website.IsAbsoluteUri)
            {
                throw new ArgumentException("The website url must be an absolute uri", nameof(website));
            }

            if (httpsOnly && website.Scheme != Uri.UriSchemeHttps)
            {
                throw new ArgumentException("The website url must be an https url only!", nameof(website));
            }
            else if (website.Scheme != Uri.UriSchemeHttp && website.Scheme != Uri.UriSchemeHttps)
            {
                //Http or https only
                throw new ArgumentException("The website url must be an http or https url", nameof(website));
            }
        }

        ///<inheritdoc/>
        public async Task<CurlResult> ExecLookupAsync(Uri website, int? timeoutMs, CancellationToken cancellation)
        {
            //Validate the url
            ValidateUrl(website);

            string timeoutArg = timeoutMs.HasValue ? $"{timeoutMs.Value / 1000}" : $"{DefaultTimeoutMs / 1000}";

            string[] args = [
                "--max-time", timeoutArg,       //Set the max time for the request
                "-S",                           //Silent mode is required
                "-H", "Accept: text/html,application/html",   //Html is required
                ..additionalArgs,               //Additional global arguments
                website.AbsoluteUri
            ];

            //Execute the curl command

            using Process? process = Exec(args);

            if (process is null)
            {
                return new CurlResult(null, true, "Curl is not enabled on this platform, lookup failed");
            }

            //Parse the html data
            Task<string?> documentHeadTask = HtmlTokenReader.ReadHeadTokenAsync(process.StandardOutput, cancellation);

            //Respect the user's timeout command and termimate the process if it exceeds the timeout
            if (timeoutMs.HasValue)
            {
                await documentHeadTask.WaitAsync(TimeSpan.FromMilliseconds(timeoutMs.Value));

                await Task.WhenAll(
                     DiscardStreamAsync(process.StandardOutput, cancellation),
                     DiscardStreamAsync(process.StandardError, cancellation)
                 ).WaitAsync(TimeSpan.FromMilliseconds(timeoutMs.Value));
            }
            else
            {
                await documentHeadTask;

                await Task.WhenAll(
                    DiscardStreamAsync(process.StandardOutput, cancellation),
                    DiscardStreamAsync(process.StandardError, cancellation)
                );
            }

            await process.WaitForExitAsync(cancellation);

            if (process.ExitCode != 0)
            {
                return new CurlResult(null, true, "Curl exited with a non-zero status code");
            }

            string? documentHead = await documentHeadTask;

            if (documentHead is null)
            {
                return new CurlResult(null, true, "Failed to parse html data");
            }

            //Get the lookup result from the document head segmetn
            WebsiteLookupResult result = HtmlTokenReader.ParseHtmlData(documentHead);

            return new CurlResult(result, false, null);
        }

        /// <summary>
        /// Safely discards the entire stream of data from the reader without 
        /// allocating a large string buffer
        /// </summary>
        /// <param name="reader">The reader to discard</param>
        /// <param name="cancellation">A token to cancel the operation</param>
        /// <returns>A task that represents the discard opeartion</returns>
        private static async Task DiscardStreamAsync(TextReader reader, CancellationToken cancellation)
        {
            using ArrayPoolBuffer<char> discarBuffer = new(8192);

            while (await reader.ReadBlockAsync(discarBuffer.AsMemory(), cancellation) > 0)
            { }
        }

        private static class HtmlTokenReader
        {
            /// <summary>
            /// Gets the document title from the head of the html document
            /// </summary>
            /// <param name="head">The head string containing the title to parse</param>
            /// <returns>The title string if found</returns>
            public static string? GetDocTitleFromHead(string head)
            {
                ReadOnlySpan<char> headChars = head.AsSpan();

                ReadOnlySpan<char> title = headChars.SliceAfterParam("<title>");
                title = title.SliceBeforeParam("</title>");

                return title.ToString();
            }

            /// <summary>
            /// Attempts to get the document summary from the head of the html document
            /// in the meta description tag
            /// </summary>
            /// <param name="head">The head string to parse</param>
            /// <returns>The document description if found</returns>
            public static string? GetDocumentSummary(string head)
            {
                ReadOnlySpan<char> headChars = head.AsSpan();

                ReadOnlySpan<char> desc = headChars.SliceAfterParam("<meta name=\"description\" content=\"");
                desc = desc.SliceBeforeParam("\"/>");
                desc = desc.SliceBeforeParam("\">");
              
                return desc.ToString();
            }

            /// <summary>
            /// Attempts to get the document keywords from the head of the html document
            /// by parsing the meta keywords tag
            /// </summary>
            /// <param name="head">The document head</param>
            /// <returns>An array of document keywords found from the head section</returns>
            public static string[]? GetDocumentKeywords(string head)
            {
                ReadOnlySpan<char> headChars = head.AsSpan();

                ReadOnlySpan<char> kwStart = headChars.SliceAfterParam("<meta name=\"keywords\" content=\"");
                ReadOnlySpan<char> kwSpan = kwStart.SliceBeforeParam("\">");

                List<string> keywords = [];

                //Split the keywords at comma, and remove any empty entries/whitespace
                kwSpan.Split(',', keywords, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                return keywords.ToArray();
            }

            public static WebsiteLookupResult ParseHtmlData(string documentHead)
            {
                //Parse head segments for title, description, and keywords
                return new WebsiteLookupResult(
                    title: GetDocTitleFromHead(documentHead),
                    description: GetDocumentSummary(documentHead),
                    keywords: GetDocumentKeywords(documentHead)
                );
            }

          

            public static async Task<string?> ReadHeadTokenAsync(TextReader reader, CancellationToken cancellation)
            {
                //String buffer to store parsed head data
                StringBuilder stringBuilder = new(1024);

                //Temp copy buffer
                using ArrayPoolBuffer<char> buffer = new(4096);

                bool isStart = true, isEnd = false;

                //scan for docuemnt head
                do
                {
                    int read = await reader.ReadBlockAsync(buffer.AsMemory(), cancellation);

                    if (read == 0)
                    {
                        //Read should never return 0, if it does, then there is no head to read
                        return null;
                    }

                    if (isStart)
                    {
                        Memory<char> headSpan = HeadStart(buffer.AsMemory());

                        //No head was found, continue buffering
                        if (headSpan.IsEmpty)
                        {
                            continue;
                        }

                        /*
                         * Try to find the end of the head, if it is found, then we can break
                         */
                        isEnd = HeadEnd(ref headSpan);

                        //Valid head data to buffer
                        stringBuilder.Append(headSpan);

                        isStart = false;
                    }
                    else
                    {
                        //Head start was already found, just need to buffer until it ends
                        Memory<char> end = buffer.AsMemory();

                        isEnd = HeadEnd(ref end);

                        stringBuilder.Append(end);

                        if (isEnd)
                        {
                            break;
                        }
                    }

                } while (!isEnd);

                return stringBuilder.ToString();
            }

            static Memory<char> HeadStart(Memory<char> start)
            {
                //find start of head
                int headStartIndex = start.Span.IndexOf("<head>");

                if (headStartIndex == -1)
                {
                    return default;
                }

                return start[headStartIndex..];
            }

            static bool HeadEnd(ref Memory<char> end)
            {
                //find end of head
                int headEndIndex = end.Span.IndexOf("</head>");

                if (headEndIndex == -1)
                {
                    return false;
                }

                end = end[..headEndIndex];
                return true;
            }
        }
    }
}

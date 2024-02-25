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
using System.Text.Json;
using System.Collections.Generic;
using System.Text.RegularExpressions;

using VNLib.Utils.IO;

using SimpleBookmark.Model;

namespace SimpleBookmark
{
    internal static partial class ImportExportUtil
    {
        /// <summary>
        /// Exports a colletion of bookmarks to a netscape bookmark file
        /// </summary>
        /// <param name="bookmarks">The bookmark collection to export</param>
        /// <param name="outputStream">The bookmark output stream to write data to</param>
        public static void ExportToNetscapeFile(IEnumerable<BookmarkEntry> bookmarks, Stream outputStream)
        {
            using VnStreamWriter writer = new(outputStream, System.Text.Encoding.UTF8, 1024)
            {
                NewLine = "\r\n"
            };

            writer.WriteLine("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
            writer.WriteLine("<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">");
            writer.WriteLine("<TITLE>Bookmarks</TITLE>");
            writer.WriteLine("<H1>Bookmarks</H1>");
            writer.WriteLine("<DL><p>");

            //Add each bookmark
            foreach (BookmarkEntry entry in bookmarks)
            {
                writer.Write("<DT><A HREF=\"");
                writer.Write(entry.Url);

                writer.Write("\" ADD_DATE=\"");
                writer.Write(new DateTimeOffset(entry.Created).ToUnixTimeSeconds());

                writer.Write("\" LAST_VISIT=\"");
                writer.Write(new DateTimeOffset(entry.LastModified).ToUnixTimeSeconds());

                //tags
                writer.Write("\" TAGS=\"");
                writer.Write(entry.Tags);

                writer.Write("\">");
                writer.Write(entry.Name);
                writer.WriteLine("</A>");

                //description
                writer.Write("<DD>");
                writer.WriteLine(entry.Description);

            }

            //Close document
            writer.WriteLine("</DL></p>");
            writer.Flush();
        }

        //Remove illegal characters from a string, ", \, and control characters
        private static readonly Regex _illegalChars = GetIllegalCharsReg();

        private static string? Escape(string? input)
        {
            return input is null ? null : _illegalChars.Replace(input, "");
        }

        public static void ExportAsCsv(IEnumerable<BookmarkEntry> bookmarks, Stream outputStream)
        {
            using VnStreamWriter writer = new(outputStream, System.Text.Encoding.UTF8, 1024)
            {
                NewLine = "\r\n"
            };

            //Write header
            writer.WriteLine("Name,Url,Description,Tags,Created,LastModified");

            //Write each bookmark
            foreach (BookmarkEntry entry in bookmarks)
            {
                //User params must be escaped with double quotes

                writer.Write("\"");
                writer.Write(Escape(entry.Name));
                writer.Write("\",\"");
                writer.Write(Escape(entry.Url));
                writer.Write("\",\"");
                writer.Write(Escape(entry.Description));
                writer.Write("\",\"");
                writer.Write(Escape(entry.Tags));
                writer.Write("\",");
                writer.Write(new DateTimeOffset(entry.Created).ToUnixTimeSeconds());
                writer.Write(",");
                writer.Write(new DateTimeOffset(entry.LastModified).ToUnixTimeSeconds());
                writer.WriteLine();
            }

            writer.Flush();
        }

        public static void ExportAsJson(IEnumerable<BookmarkEntry> bookmarks, Stream outputStream)
        {
            using Utf8JsonWriter writer = new(outputStream, default);

            writer.WriteStartArray();

            foreach (BookmarkEntry entry in bookmarks)
            {
                writer.WriteStartObject();

                writer.WriteString("Name", entry.Name);
                writer.WriteString("Url", entry.Url);
                writer.WriteString("Description", entry.Description);
                writer.WriteString("Tags", entry.Tags);
                writer.WriteNumber("Created", new DateTimeOffset(entry.Created).ToUnixTimeSeconds());
                writer.WriteNumber("LastModified", new DateTimeOffset(entry.LastModified).ToUnixTimeSeconds());

                writer.WriteEndObject();
            }

            writer.WriteEndArray();
        }

        [GeneratedRegex("[\"\\p{Cc}]", RegexOptions.Compiled)]
        private static partial Regex GetIllegalCharsReg();
    }
}

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
using SimpleBookmark.Model;
using System.Collections.Generic;
using VNLib.Utils.IO;



namespace SimpleBookmark
{
    internal static class ImportExportUtil
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
    }
}

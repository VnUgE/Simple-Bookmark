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

import type { Bookmark } from '../../store/bookmarks'
import { split, first, includes, map, filter, nth, isEmpty } from 'lodash-es'

export const parseNetscapeBookmarkString = (bookmarkString: string) : Bookmark[] => {
    const lines = split(bookmarkString, '\n');
    //remove any empty lines
    const elements = filter(lines, l => l.length > 0)

    const header = first(elements);
    if(!includes(header, 'NETSCAPE-Bookmark-file-1')) {
        throw new Error('Invalid bookmark file');
    }

    const bookmarks = map(elements, (line, index): Partial<Bookmark> => {

        //Search for required html components in the line
        const Url = line.match(/HREF="([^"]*)"/)?.[1];
        const tags = line.match(/TAGS="(.*)"/)?.[1];
        const Name = line.match(/">(.*)<\/A/)?.[1];
        const date = line.match(/ADD_DATE="([^"]*)"/)?.[1];
        //Next line should be the description
        const descriptionEl = nth(elements, index + 1);
        const Description = split(descriptionEl, '<DD>')?.[1];

        const Tags = filter(split(tags, ','), t => !isEmpty(t));

        const bookmark: Partial<Bookmark> = {
            Name,
            Url,
            Description,
        }

        //Only set tags if there are any
        if(!isEmpty(Tags)) {
            bookmark.Tags = Tags;
        }

        if (date){
            bookmark.Created = new Date(parseInt(date) * 1000).toISOString();
        }
        return bookmark;
    });

    //Filter any empty entires
    return filter(bookmarks, b => b.Name && b.Url) as Bookmark[];
}
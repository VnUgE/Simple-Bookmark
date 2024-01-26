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
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

using FluentValidation;

using Microsoft.EntityFrameworkCore;

using VNLib.Plugins.Extensions.Data;
using VNLib.Plugins.Extensions.Data.Abstractions;

namespace SimpleBookmark.Model
{
    [Index(nameof(Url))]
    internal sealed partial class BookmarkEntry : DbModelBase, IUserEntity, IJsonOnDeserialized
    {
        [Key]
        public override string Id { get; set; }

        public override DateTime Created { get; set; }

        public override DateTime LastModified { get; set; }

        [JsonIgnore]
        public string? UserId { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(200)]
        public string? Url { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        //Json flavor
        [NotMapped]
        [JsonPropertyName("Tags")]
        public string[]? JsonTags
        {
            get => Tags?.Split(',');
            set => Tags = value is null ? null : string.Join(',', value);
        }

        //Database flavor as string
        [JsonIgnore]
        [MaxLength(100)]
        public string? Tags { get; set; }

        public static IValidator<BookmarkEntry> GetValidator()
        {
            InlineValidator<BookmarkEntry> validator = new();

            validator.RuleFor(p => p.Name)
                .NotEmpty()
                .Matches(@"^[a-zA-Z0-9_\-\|\., ]+$", RegexOptions.Compiled)
                .MaximumLength(100);

            validator.RuleFor(p => p.Url)
                .NotEmpty()
                .Matches(@"^https?://", RegexOptions.Compiled)
                .MaximumLength(200);

            validator.RuleFor(p => p.Description)
                .MaximumLength(500);

            //Tags must be non-empty and alphanumeric only, no spaces
            validator.RuleForEach(p => p.JsonTags)
                .NotNull()
                .NotEmpty()
                .Matches(@"^[a-zA-Z0-9]+$", RegexOptions.Compiled);

            return validator;
        }

        public void OnDeserialized()
        {
            //Trim whitespace from all string properties
            Name = Name?.Trim();
            Url = Url?.Trim();
            Description = Description?.Trim();
        }
    }
}

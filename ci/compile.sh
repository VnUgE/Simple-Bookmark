#!/bin/sh

inputFile="$1"
outputFile="$2"

# Read the template file and substitute environment variables
while IFS= read -r line || [ -n "$line" ]; do
    # Use parameter expansion to substitute environment variables
    modifiedLine="${line//\$\{*\}/}"

    # Check for default value syntax
    if [[ $line =~ \$\{([A-Za-z_][A-Za-z0-9_]*)\:-([^\}]+)\} ]]; then
        varName="${BASH_REMATCH[1]}"
        defaultValue="${BASH_REMATCH[2]}"
        envValue="${!varName:-$defaultValue}"
        modifiedLine="${line//\$\{$varName\:-$defaultValue\}/$envValue}"
    fi

    #check for variables without defaults
    if [[ $line =~ \$\{([A-Za-z_][A-Za-z0-9_]*)\} ]]; then
        varName="${BASH_REMATCH[1]}"
        envValue="${!varName}"
        modifiedLine="${line//\$\{$varName\}/$envValue}"
    fi

    # Append the modified line to the output file
    echo "$modifiedLine" >> "$outputFile"
done < "$inputFile"

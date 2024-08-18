#! /bin/sh

#this script will be invoked by dumb-init in the container on statup and is located at /app

substitute_config_file() {
    local templateFilePath="$1"
    local outputFilePath="$2"

    # Substitute environment variables with their values or default values
    while IFS= read -r line; do
        # Use pattern matching and parameter expansion to handle defaults
        modifiedLine=$(echo "$line" | sed -E 's/\$\{([^:-]+)(:-([^}]+))?\}/$(echo "${\1:-\3}")/ge')
        eval "echo \"$modifiedLine\""
    done < "$templateFilePath" > "$outputFilePath"
}

echo "Generating configuration files"

rm -rf config && mkdir config

#move the routes xml file to the output config dir
cp config-templates/routes.xml config/routes.xml

#substitude all -template files in the config-templates dir and write them to the config dir
for file in config-templates/*-template.json; do
    substitute_config_file $file config/$(basename $file -template.json).json
done

echo "Complete"

echo "Merging your asset files"
cp usr/assets/* plugins/assets/ -rf
echo "Complete"

#start the server
echo "Starting the server"
dotnet webserver/VNLib.WebServer.dll --config config/config.json --input-off $SERVER_ARGS
#! /bin/sh

#this script will be invoked by dumb-init in the container on statup and is located at /app

echo "Generating configuration files"

rm -rf config && mkdir config

#substitude all -template files in the config-templates dir and write them to the config dir
for file in config-templates/*-template.json; do
	envsubst < $file > config/$(basename $file -template.json).json
done

echo "Complete"

echo "Merging your asset files"
cp usr/assets/* plugins/assets/ -rf
echo "Complete"

#start the server
echo "Starting the server"
dotnet webserver/VNLib.WebServer.dll --config config/config.json --input-off $SERVER_ARGS
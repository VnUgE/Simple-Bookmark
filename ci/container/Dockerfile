#Copyright (c) Vaughn Nugent
#Licensed under the GNU AGPL V3.0

#use plain alpine latest to build native libraries in
FROM alpine:3.19 as native-cont

#install public libs and build tools
RUN apk update && apk add --no-cache build-base cmake npm git openssl
#most universal way to use Task is from NPM
RUN npm install -g @go-task/cli

WORKDIR /build
 
#include local artifacts
COPY app/ .

#build internal libraries and copy the libraries to the /lib output directory
RUN mkdir out/ ssl/
RUN task build-libs

#APP CONTAINER
#move into a clean dotnet apline lean image
FROM mcr.microsoft.com/dotnet/runtime:8.0.8-alpine3.19-amd64 as app-cont

LABEL name="vnuge/simple-bookmark"
LABEL maintainer="Vaughn Nugent <vnpublic@proton.me>"
LABEL description="A linkding inspired, self hosted, bookmark manager"

#copy local artifacts again in run container
COPY app/ /app

#pull compiled libs from build container
COPY --from=native-cont /build/out /app/lib
#copy self signed ssl certs for first startup
COPY --from=native-cont /build/ssl /app/ssl

RUN apk update && apk add --no-cache gettext icu-libs dumb-init curl

#workdir 
WORKDIR /app

#default to 8080 for TLS on TCP
EXPOSE 8080/tcp

VOLUME  /app/data    \
        /app/ssl     \
#expose an assets directory for custom assets install
        /app/usr/assets

#disable dotnet invariant culture on alpine
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=0

#add helper/required libraries
#ENV VNLIB_SHARED_HEAP_FILE_PATH=/app/lib/libvn_rpmalloc.so		not ready yet, still need to debug
ENV VNLIB_ARGON2_DLL_PATH=/app/lib/libargon2.so \
  COMPRESSION_LIB_PATH=/app/lib/libvn_compress.so 

#set default env variables
ENV MAX_BOOKMARKS=5000          \
 MAX_CONTENT_LENGTH=5120000     \
 REG_TOKEN_DURATION_MIN=360     \
 MAX_LOGIN_ATTEMPS=10

#SQL Config
ENV SQL_LIB_PATH=VNLib.Plugins.Extensions.Sql.SQLite.dll
ENV SQL_CONNECTION_STRING="Data Source=data/simple-bookmark.db;"


#HC Vault
ENV HC_VAULT_ADDR=""            \
 HC_VAULT_TOKEN=""              \
 HC_VAULT_TRUST_CERT=false

#VNCACHE (default to memory only)
ENV CACHE_ASM_PATH=VNLib.Data.Caching.Providers.VNCache.dll \
 MEMCACHE_ONLY=true             \
 REDIS_CONNECTION_STRING=""     \
 VNCACHE_INITIAL_NODES=[]

#SECRETS
ENV PASSWORD_PEPPER=""          \
 DATABASE_PASSWORD=""           \
 REDIS_PASSWORD=""              \
 VNCACHE_CLIENT_PRIVATE_KEY=""  \
 VNCACHE_CACHE_PUBLIC_KEY=""


#HTTP/PROXY Config
ENV HTTP_DOWNSTREAM_SERVERS=[]  \
 HTTP_TRACE_ON=false

#set default certificate files to the self signed ones created in the build container
ENV SSL_JSON='{"cert": "ssl/cert.pem", "privkey":"ssl/key.pem"}'

#disable plugin debugging by default
ENV DEBUG_PLUGINS=false

#run the init script within dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["ash", "./run.sh"]


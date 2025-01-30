#Copyright (c) Vaughn Nugent
#Licensed under the GNU AGPL V3.0

#use plain alpine latest to build native libraries in
FROM ubuntu:24.04 as native-cont

#install public libs and build tools
RUN apt update \
  && apt install -y build-essential cmake git openssl

WORKDIR /build

#download and install task (t its easier an faster without npm)
ADD --checksum=sha256:a35462ec71410cccfc428072de830e4478bc57a919d0131ef7897759270dff8f \
  https://github.com/go-task/task/releases/download/v3.40.1/task_linux_amd64.tar.gz \
  task_linux_amd64.tar.gz

RUN tar -xzf task_linux_amd64.tar.gz && mv task /usr/local/bin/task
 
#include local artifacts
COPY app/ .

#runs setup tasks such as building libraries and configuring directories
RUN task setup && task container-create-cert

#APP CONTAINER
#move into a clean dotnet apline lean image
FROM mcr.microsoft.com/dotnet/runtime:8.0.12-noble as app-cont

LABEL name="vnuge/simple-bookmark"
LABEL maintainer="Vaughn Nugent <vnpublic@proton.me>"
LABEL description="A linkding inspired, self hosted, bookmark manager"

#pull compiled libs from build container
COPY --from=native-cont /build/lib/vnlib_rpmalloc.so /app/lib/vnlib_rpmalloc.so
COPY --from=native-cont /build/lib/vnlib_compress.so /app/lib/vnlib_compress.so
COPY --from=native-cont /build/lib/argon2.so /app/lib/argon2.so
#copy task binary from build container
COPY --from=native-cont /usr/local/bin/task /usr/local/bin/task

#copy self signed ssl certs for first startup
COPY --from=native-cont /build/ssl /app/ssl

RUN apt update && apt install -y dumb-init curl

#copy local artifacts again in run container
COPY app/ /app

#workdir 
WORKDIR /app

#default to 8080 for TLS on TCP
EXPOSE 8080/tcp

VOLUME  [ "/app/data", "/app/ssl", "/app/usr/assets" ]

#SQL Config
ENV SQL_LIB_PATH=VNLib.Plugins.Extensions.Sql.SQLite.dll \
  SQL_CONNECTION_STRING="Data Source=data/simple-bookmark.db;" \
  CACHE_ASM_PATH=VNLib.Data.Caching.Providers.VNCache.dll \
  COMPRESSOR_ASM_PATH=lib/vnlib.net.compression/VNLib.Net.Compression.dll

#run permissions setup 
RUN task container-set-perms

#run the init script within dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["task", "container-run", "--", "--input-off"]


#Copyright (c) Vaughn Nugent
#Licensed under the GNU AGPL V3.0

#use plain alpine latest to build native libraries in
FROM ubuntu:24.04 as native-cont

#download and install task (its easier and faster without npm)
ADD --checksum=sha256:fe61611118e586e51eec55678a8a00409111ff723ada07bfb6cda2897814b42a \
  https://github.com/go-task/task/releases/download/v3.41.0/task_linux_amd64.deb \
  task_linux_amd64.deb

RUN dpkg -i task_linux_amd64.deb

#include local artifacts
COPY app/ .

#installs required dependencies and builds the native libraries (also openssl)
RUN task setup-apt 'ADD_PACKAGES="openssl"' \
  && task create-cert

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


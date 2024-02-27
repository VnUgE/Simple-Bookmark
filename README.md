﻿<h1 align="center">Simple Bookmark</h1> 

<p align="center">
A <a href="https://github.com/sissbruecker/linkding">linkding</a> inspired, self-hosted, bookmark manager built with my <a href="https://github.com/VnUgE/VNLib.Core">Essentials</a> framework that only requires .NET 8.0, an SQL database, and a C compiler. 
</p>

<h4 align="center">
  <a href="https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark">Downloads</a> |
  <a href="https://www.vaughnnugent.com/resources/software">My Software</a> |
  <a href="https://www.vaughnnugent.com/resources/software/articles?tags=_simple-bookmark">Documentation</a>
</h4>

<h4 align="center">
   <img src="https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white" alt=".NET"/>
    <img src="https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D" alt="VueJS"/>     
    <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwindcss"/>
     <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Latest commit"/>
</h4>
<h4 align="center">
  <a href="https://github.com/VnUgE/Simple-Bookmark/blob/master/LICENSE.txt">
    <img src="https://img.shields.io/badge/license-AGPL3-green.svg?style=for-the-badge" alt="Simple Bookmark is licensed to you with the GNU GPL Affero V3" />
  </a>
  <a href="https://github.com/VnUgE/Simple-Bookmark/tags">
    <img src="https://img.shields.io/github/v/tag/vnuge/simple-bookmark?style=for-the-badge" alt="Latest version"/>
  </a>
  <a href="https://github.com/VnUgE/Simple-Bookmark/tags">
    <img src="https://img.shields.io/github/last-commit/vnuge/simple-bookmark/master?style=for-the-badge" alt="Latest commit"/>
  </a>
</h4>
<img src="https://www.vaughnnugent.com/public/resources/downloads/cms/c/xgcyngwftvabsvlcwcb3ecoclu.png" width="100%">

## Intro
Simple Bookmark (name pending) is a fast, portable, and secure, self-hosted bookmark manager that was inspired by the [Linkding](https://github.com/sissbruecker/linkding) project.  

Simple Bookmark was built using my [Essentials](https://github.com/VnUgE/vnlib.core) web framework which enables high performance web applications and back-end extensibility in a small package. While it comes preconfigured with SQLite by default, I have 1st party support for MySQL and SQLServer, through add-on packages. It supports memory, Redis, or VNCache session for data caching.   

### Features
- Light/Dark theme
- TOTP and public-key authentication
- HTML bookmark file import from Linkding and others
- HTML, JSON, and CSV bookmark export
- Bookmark quick-add for browsers
- Invite users with share links
- Supports (and tested) SQLite, SQLServer, MySQL/MariaDB databases
- It's quick <300ms load time & under 150kB with compression
- It's small, 139mb Docker image
- Argon2Id password hashing with secure defaults
- Supports downstream proxy servers
- Built-in TLS (TLS is required)

## Deployment overview  
__You need to read the [quick-start guide](https://www.vaughnnugent.com/resources/software/articles/ed9285b63922fd17b5126051e3a2e592cacecf33) to fully configure Simple-Bookmark but here are the basic steps.__  

> Simple-bookmark was built without Docker as the primary target, this is because I believe users should have the support to deploy open source apps easily outside of a container. So while a Docker deployment is an option, the container is actually built from the Linux-x64 package during CI build time.  

### Container install
Download the latest alpine build package: [sb-alpine3.19-oci.tgz](https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark?p=Simple-Bookmark)  

This archive contains all the software needed to build the image locally. It also comes with a docker-compose.yaml file for easy setup and deployment. Here is the gist:  
```  shell
tar -xzf sb-alpine3.19-oci.tgz
docker build . -t vnuge/simple-bookmark
docker-compose up -d
```
 _Of course there is more setup involved, so take a look at the docs for more info_  
 
The image should be about 139mb when built! I'm also hoping to get it down even smaller in the future. You may also use Podman in the same format, simply substitute the word `docker` for `podman` in the previous commands.  

### Bare-metal install
Download the latest archive for your operating system [here](https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark?p=Simple-Bookmark)  

#### Linux overview
- Install [Task](https://taskfile.dev), [CMake](https://cmake.org), GCC (or your favorite libc toolchain) and dotnet-runtime-8.0 (non-ASP)  
- Build the native libraries with the included script: `cd lib/ && sh ./setup.sh`  
- Configure the server by opening the `config.json` file in the working directory  
- Set required environment variables (read documentation)  
- Run the server with: `dotnet webserver/VNLib.WebServer.dll --config config.json`  

#### Windows overview
- Install the .NET Runtime (non-ASP) package and make sure the command `dotnet` is valid  
- Your native dependencies should already have been built for you and included in your package, you just need to find the DLL file paths to add to your system environment variables.  
- Set required environment variables (read documentation)  
- Run the server with: `webserver/VNLib.WebServer.exe --config config.json`  

## Links & Support
[Package downloads](https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark) - Archives, checksums, signatures, and module source code  
[Documentation](https://www.vaughnnugent.com/resources/software/articles?tags=docs,_Simple-Bookmark) - quick-start guides, user guides and more (work in progress)  


### Compatibility Notes
Simple-Bookmark uses far more aggressive input sensitization than Linkding and others. I am still working out a happy medium on aggressive safety and usability. When importing bookmarks, you may consider selecting the `fix errors` checkbox that will attempt to correct your HTML file import by replacing illegal characters with white-space.

### License  
The software in this repository is licensed under the GNU Affero General Public License version 3 (or any later version). See the LICENSE files for more information.  

### Contact  
Head over to my [website](https://www.vaughnnugent.com) for my contact info/community.  

### Other open source notices
This project was initially built in about a week using [Flowbite](https://flowbite.com). I really tried to push myself with a new front-end application from scratch using a new component library. I will slowly clean up the repeated tailwindcss utilities to make classes more unified throughout the app, but it's low priority. So big shout out to the Flowbite project and their free components and svg icons.  

This project was also heavily inspired by the [Linkding](https://github.com/sissbruecker/linkding) project which I used for years until I wanted to escape the Docker container and add some new features and speed it up! Thanks for the awesome inspiration!  

Finally of course VueJS, Vite, Tailwindcss, Postcss, VueUse, HeadlessUI, and many other FOSS projects made this possible!  
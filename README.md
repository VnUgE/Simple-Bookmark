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

I built Simple-Bookmark mostly because I didn't want the container lock-in. I also wanted more extensibility for caching, databases, authentication methods, modern security defaults, 2FA, and a performance oriented [server framework](https://github.com/VnUgE/VNLib.Core). Finally, while I enjoy linkding's UI, I felt like it could use some modernization and a little more reactivity. 

### Features
- Light/Dark theme
- 2FA and public-key JWT authentication
- HTML bookmark file import from Linkding and others
- HTML, JSON, and CSV bookmark export
- Bookmark quick-add for web browsers
- Invite users with share links
- Supports (and tested) SQLite, SQLServer, MySQL/MariaDB databases
- It's quick, <300ms load time & under 150kB with compression
- It's small, 127mb Docker image
- Argon2Id password hashing with secure defaults
- Supports enterprise services: HashiCorp Vault, SQLServer, Auth0, and Redis
- Built-in TLS (TLS is required)

## Get Started
__Please read the [quick start guide](https://www.vaughnnugent.com/resources/software/articles?tags=docs,_Simple-Bookmark)__ 

⚠ These are only some quick and dirty commands to give you the gist of the install process.

### Container  
Download the [sb-alpine3.19-oci.tgz package](https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark?p=Simple-Bookmark) 
```
mkdir simple-bookmark && cd simple-bookmark/
tar -xzf sb-alpine3.19-oci.tgz
podman-compose build
podman-compose up -d
```

### Bare Metal
__Windows users please see quick start guide__

Download the [realease package](https://www.vaughnnugent.com/resources/software/modules/Simple-Bookmark?p=Simple-Bookmark) for your os
```
mkdir simple-bookmark && cd simple-bookmark/
tar -xzf <your-os>-release.tgz
task setup-<dnf | apt | apk> #requires root perms to install apps
task create-cert #requires sudo for openssl command
task create-pepper #uses openssl to create a random string and saves it to a file secrets/pepper.txt
```

## Compatibility Notes
Simple-Bookmark uses far more aggressive input sensitization than Linkding and others. I am still working out a happy medium on aggressive safety and usability. When importing bookmarks, you may consider selecting the `fix errors` checkbox that will attempt to correct your HTML file import by replacing illegal characters with white-space.

## License  
The software in this repository is licensed under the GNU Affero General Public License version 3 (or any later version). See the LICENSE files for more information.  

## Contact  
Head over to my [website](https://www.vaughnnugent.com) for my contact info/community.  

## Other open source notices
This project was initially built in about a week using [Flowbite](https://flowbite.com). I really tried to push myself with a new front-end application from scratch using a new component library. I will slowly clean up the repeated tailwindcss utilities to make classes more unified throughout the app, but it's low priority. So big shout out to the Flowbite project and their free components and svg icons.  

This project was also heavily inspired by the [Linkding](https://github.com/sissbruecker/linkding) project which I used for years until I wanted to escape the Docker container and add some new features and speed it up! Thanks for the awesome inspiration!  

Finally of course VueJS, Vite, Tailwindcss, Postcss, VueUse, HeadlessUI, and many other FOSS projects made this possible!  
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
 - Container builds now use the same release scripts as metal builds
 - Container pacakge is slightly more trimmed down
 - Container image now uses a Debain base instead of Alpine Linux

### Removed
 - Confusing compose variables that exist for powerusers only

## [0.1.8-alpha]

### Added
 - Webauthn Support
 - Allow loading custom password hashing libraries
 - A posix portable package for all platforms 
 - This changelog!

### Changed
 - Browser history should work between tab changes now so forward/back buttons work
 - Form errors are now displayed below the input box
 - MFA is all optional now and admins can disable these featuers and the UI should show/hide them accordingly
 - RPMalloc memory allocator enabled for server
 - Disabled Pki OTP login by default
 - No longer relies on cookies for UI login status
 - Reorganized server api endpoints

### Removed
 - **Container:** Container package for this pre-release was removed for now
 - Unused code and libraries (social oauth)

### Fixed
 - Many validation and startup issues with VNLib updates
 - Should now be more comaptible with other vnlib applications due to cookie changes

## [0.1.7]

### Added
- Added a build: directive to the docker-compose file

### Updated
- Updated dependencies (security/bug fixes)

## [0.1.6]

### Added
- Added version number under package name on desktop

### Updated
- Updated dependencies (security/bug fixes)
- Hardened password hashing libraries
- General HTTP performance upgrades

### Fixed
- vault variables no longer required unless vault is used in container

## [0.1.5]

### Added
- **Container:** Create a default self signed SSL cert on startup
- **Container:** Default the SSL certificate location environment variable, for easy override
- **Container:** Added some extra docs in docker-compose.yaml file

### Changed
- Set password pepper to a local file at `secrets/password_pepper.txt`
- Container size down to 127mb!

### Updated
- package size has been trimmed even more down to < 9mb

### Fixed
- Inputs reset after admin account creation
- Fixed buggy terminal after startup when interactive
- **Container:** remove the double compression library build command for faster builds

## [0.1.4]

### Added
- Added more details to error logs for connection issues
- nginx style connection logging (tracing) support

### Updated
- Merge compression library performance updates
- Updated native library compilation for bare-metal installs

### Fixed
- preexisting cookies were not getting cleared properly
- actually stay logged-in now if 'Stay signed in' is enabled

## [0.1.3]

### Added
- Added spinners to sign-in/out buttons
- Link lookup errors are now displayed

### Changed
- Changed login to sign in for consistency
- Duplicate bookmarks with the same URL are now rejected

### Updated
- Green highlight on add/edit only visible when focused

### Fixed
- Fixed login client status when client is out of sync

## [0.1.2]

### Added
- Windows 10/Server v1904+ x64 users now have pre-compiled dll files included in the package
- Added Hashicorp Vault https support with self signed certs

### Fixed
- Fixed SQLServer 2008+ proper date-time support
- Slightly improved startup time
- Slightly reduce static memory consumption
- Eliminated excessive library loading (reduced OS handle count)

[unreleased]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.8-alpha...HEAD
[0.1.8-alpha]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.7...v0.1.8-alpha
[0.1.7]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/VnUgE/Simple-Bookmark/compare/v0.1.0...v0.1.1

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
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

using FluentValidation;

using VNLib.Utils.Memory;
using VNLib.Utils.Logging;
using VNLib.Utils.Extensions;
using VNLib.Hashing;
using VNLib.Hashing.IdentityUtility;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Accounts;
using VNLib.Plugins.Essentials.Endpoints;
using VNLib.Plugins.Essentials.Extensions;
using VNLib.Plugins.Essentials.Users;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Validation;
using VNLib.Plugins.Extensions.Loading.Users;
using VNLib.Plugins.Extensions.Loading.Events;
using VNLib.Plugins.Extensions.Loading.Routing;

namespace SimpleBookmark.Endpoints
{
    [EndpointPath("{{path}}")]
    [EndpointLogName("Accounts")]
    [ConfigurationName("registration")]
    internal sealed class BmAccountEndpoint : UnprotectedWebEndpoint
    {

        private static readonly IValidator<NewUserRequest> NewRequestVal = NewUserRequest.GetValidator();
        private static readonly IValidator<RegSubmitRequest> RegSubmitVal = RegSubmitRequest.GetValidator();
        private static readonly IValidator<RegSubmitRequest> AdminRegVal = RegSubmitRequest.GetAdminValidator();

        private readonly IUserManager Users;
        private readonly TimeSpan Expiration;
        private readonly JwtAuthManager AuthMan;
        //private readonly BookmarkStore Bookmarks;
        private readonly bool SetupMode;
        private readonly bool Enabled;

        public BmAccountEndpoint(PluginBase plugin, IConfigScope config)
        {
            //get setup mode and enabled startup arguments
            SetupMode = plugin.HostArgs.HasArgument("--setup");
            Enabled = !plugin.HostArgs.HasArgument("--disable-registation");

            Expiration = config.GetRequiredProperty("token_lifetime_mins", p => p.GetTimeSpan(TimeParseType.Minutes));

            Users = plugin.GetOrCreateSingleton<UserManager>();
            //Bookmarks = plugin.GetOrCreateSingleton<BookmarkStore>();
            
            /*
             * JWT manager allows regenerating the signing key on a set interval.
             * 
             * This means that if keys are generated on the edge of an interval,
             * it will expire at the next interval which could be much shorter
             * than the set interval. This is a security feature to prevent
             * long term exposure of a signing key.
             * 
             */
            AuthMan = new JwtAuthManager(64);

            if(config.TryGetProperty("key_regen_interval_mins", p => p.GetTimeSpan(TimeParseType.Minutes), out TimeSpan regen))
            {
                plugin.ScheduleInterval(AuthMan, regen, false);
            }
        }

        //Essentially a whoami endpoint for current user
        protected override VfReturnType Get(HttpEntity entity)
        {
            WebMessage msg = new()
            {
                Success = true
            };

            //Only authorized users can check their status
            if (Enabled && entity.IsClientAuthorized(AuthorzationCheckLevel.Critical))
            {
                //Pass user status when logged in
                msg.Result = new StatusResponse
                {
                    SetupMode = SetupMode,
                    Enabled = Enabled,
                    CanInvite = entity.Session.CanAddUser(),
                    ExpirationTime = (int)Expiration.TotalSeconds
                };
            }
            else
            {
                msg.Result = new StatusResponse
                {
                    SetupMode = SetupMode,
                    Enabled = Enabled
                };
            }

            return VirtualOk(entity, msg);
        }

        /*
         * PUT will generate a new user request if the current has an admin
         * role. This will return a jwt token that can be used to register a new
         * user account. The token will expire after a set time.
         */

        protected override async ValueTask<VfReturnType> PutAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

            if (webm.Assert(Enabled, "User registation was disabled via commandline"))
            { 
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            //Only authorized users can generate new requests
            if(!entity.IsClientAuthorized(AuthorzationCheckLevel.Critical))
            {
                webm.Result = "You do not have permissions to create new users";
                return VirtualClose(entity, webm, HttpStatusCode.Unauthorized);
            }

            //Make sure user is an admin
            if (webm.Assert(entity.Session.CanAddUser(), "You do not have permissions to create new users"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            //Try to get the new user request
            NewUserRequest? request = entity.GetJsonFromFile<NewUserRequest>();
            if (webm.Assert(request != null, "No request body provided"))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            if(!NewRequestVal.Validate(request, webm))
            {
                return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
            }

            //Make sure the user does not already exist
            using (IUser? user = await Users.GetUserFromUsernameAsync(request.Username!, entity.EventCancellation))
            {
                if (webm.Assert(user == null, "User already exists"))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.Conflict);
                }
            }

            //Start with min user privilages
            ulong privileges = RoleHelpers.MinUserRole;

            //Optionally allow the user to add new userse
            if(request.CanAddUsers)
            {
                privileges = RoleHelpers.WithAddUserRole(privileges);
            }

            //Init new request
            using JsonWebToken jwt = new();

            //issue new payload for registration
            jwt.WritePayload(new JwtPayload
            {
                Expiration = entity.RequestedTimeUtc.Add(Expiration).ToUnixTimeSeconds(),
                Subject = request.Username!,
                PrivLevel = privileges,
                Nonce = RandomHash.GetRandomHex(16)
            });

            AuthMan.SignJwt(jwt);
            webm.Result = jwt.Compile();
            webm.Success = true;
        
            return VirtualClose(entity, webm, HttpStatusCode.OK);
        }

        protected override async ValueTask<VfReturnType> PostAsync(HttpEntity entity)
        {
            ValErrWebMessage webm = new();

            if (webm.Assert(Enabled, "User registation was disabled via commandline."))
            {
                return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
            }

            using RegSubmitRequest? req = await entity.GetJsonFromFileAsync<RegSubmitRequest>();

            if (webm.Assert(req != null, "No request body provided."))
            {
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }

            //Users can specify an admin username when setup mode is enabled
            if (!string.IsNullOrWhiteSpace(req.AdminUsername))
            {
                if(webm.Assert(SetupMode, "Admin registation is not enabled."))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.Forbidden);
                }

                //Validate against admin reg
                if(!AdminRegVal.Validate(req, webm))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
                }

                try
                {
                    //Default to min user privilages + add user privilages, technically the same as admin here
                    ulong adminPriv = RoleHelpers.WithAddUserRole(RoleHelpers.MinUserRole);

                    await CreateUserAsync(req.AdminUsername, adminPriv, req.Password, entity.EventCancellation);

                    webm.Result = "Successfully created your new admin account.";
                    webm.Success = true;

                    return VirtualClose(entity, webm, HttpStatusCode.Created);
                }
                catch (UserExistsException)
                {
                    webm.Result = "User account already exists";
                    return VirtualClose(entity, webm, HttpStatusCode.Conflict);
                }
            }

            //Normal link registration
            if(!RegSubmitVal.Validate(req, webm))
            {
                return VirtualClose(entity, webm, HttpStatusCode.UnprocessableEntity);
            }

            try
            {
                //Try to recover the initial jwt from the request
                using JsonWebToken jwt = JsonWebToken.Parse(req.Token!);

                if (webm.Assert(AuthMan.VerifyJwt(jwt), "Registation failed, your link is invalid."))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
                }

                JwtPayload p = jwt.GetPayload<JwtPayload>()!;

                //Make sure the token is not expired
                if (webm.Assert(p.Expiration > entity.RequestedTimeUtc.ToUnixTimeSeconds(), "Registation failed, your link has expired"))
                {
                    return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
                }

                //Check that the user is not already registered
                using (IUser? user = await Users.GetUserFromUsernameAsync(p.Subject, entity.EventCancellation))
                {
                    if (webm.Assert(user == null, "Your account already exists"))
                    {
                        /*
                         * It should be fine to tell the user that the account already exists
                         * because login tokens are "secret" and the user would have to know
                         * the token to use it.
                         */

                        return VirtualClose(entity, webm, HttpStatusCode.Conflict);
                    }
                }

                //Create the new user
                await CreateUserAsync(p.Subject, p.PrivLevel, req.Password, entity.EventCancellation);

                webm.Result = "Successfully created you new account!";
                webm.Success = true;

                return VirtualClose(entity, webm, HttpStatusCode.Created);
            }
            catch (FormatException)
            {
                webm.Result = "Registation failed, your link is invalid.";
                return VirtualClose(entity, webm, HttpStatusCode.BadRequest);
            }
        }

        private async Task CreateUserAsync(string userName, ulong privLevel, string? password, CancellationToken cancellation)
        {
            //Create the new user
            UserCreationRequest newUser = new()
            {
                Username = userName,
                InitialStatus = UserStatus.Active,
                Privileges = privLevel,
                Password = PrivateString.ToPrivateString(password, false),
            };

            using IUser user = await Users.CreateUserAsync(newUser, null, cancellation);
            
            //Assign a local account status and email address
            user.SetAccountOrigin(AccountUtil.LOCAL_ACCOUNT_ORIGIN);
            user.EmailAddress = userName;

            await user.ReleaseAsync(cancellation);
        }
        

        /*
         * TODO
         * USERS DELETE OWN ACCOUNTS HERE
         * 
         * Users may delete their own accounts if they are logged in.
         * This function should delete all bookmarks, and their own account
         * from the table. This requires password elevation aswell.
         */
        protected override ValueTask<VfReturnType> DeleteAsync(HttpEntity entity)
        {
            return base.DeleteAsync(entity);
        }

        private sealed class JwtAuthManager(int keySize) : IIntervalScheduleable
        {
            /*
             * Random signing keys are rotated on the configured expiration 
             * interval.
             */

            private byte[] secretKey = RandomHash.GetRandomBytes(keySize);

            Task IIntervalScheduleable.OnIntervalAsync(ILogProvider log, CancellationToken cancellationToken)
            {
                secretKey = RandomHash.GetRandomBytes(keySize);
                return Task.CompletedTask;
            }

            public void SignJwt(JsonWebToken jwt) => jwt.Sign(secretKey, GetHashAlg());

            public bool VerifyJwt(JsonWebToken jwt) => jwt.Verify(secretKey, GetHashAlg());

            private static HashAlg GetHashAlg()
            {
                if (ManagedHash.IsAlgSupported(HashAlg.BlAKE2B))
                {
                    return HashAlg.BlAKE2B;
                }
                else if (ManagedHash.IsAlgSupported(HashAlg.SHA3_256))
                {
                    return HashAlg.SHA3_256;
                }
                else
                {
                    //fallback to sha256
                    return HashAlg.SHA256;
                }
            }
        }
      

        private sealed class JwtPayload
        {
            [JsonPropertyName("sub")]
            public string Subject { get; set; } = string.Empty;

            [JsonPropertyName("level")]
            public ulong PrivLevel { get; set; }

            [JsonPropertyName("exp")]
            public long Expiration { get; set; }

            [JsonPropertyName("n")]
            public string Nonce { get; set; } = string.Empty;
        }

        private sealed class NewUserRequest
        {
            [JsonPropertyName("username")]
            public string Username { get; set; } = string.Empty;

            [JsonPropertyName("can_add_users")]
            public bool CanAddUsers { get; set; }

            public static IValidator<NewUserRequest> GetValidator()
            {
                InlineValidator<NewUserRequest> val = new();

                val.RuleFor(p => p.Username)
                    .NotNull()
                    .NotEmpty()
                    .EmailAddress()
                    .Length(1, 200);

                return val;
            }
        }

        private sealed class StatusResponse
        {
            [JsonPropertyName("setup_mode")]
            public bool SetupMode { get; set; }

            [JsonPropertyName("enabled")]
            public bool Enabled { get; set; }

            [JsonPropertyName("can_invite")]
            public bool? CanInvite { get; set; }

            [JsonPropertyName("link_expiration")]
            public int? ExpirationTime { get; set; }
        }

        private sealed class RegSubmitRequest() : PrivateStringManager(1)
        {
            [JsonPropertyName("token")]
            public string? Token { get; set; }

            [JsonPropertyName("admin_username")]
            public string? AdminUsername { get; set; }

            [JsonPropertyName("password")]
            public string? Password
            {
                get => base[0];
                set => base[0] = value;
            }

            public static IValidator<RegSubmitRequest> GetValidator()
            {
                InlineValidator<RegSubmitRequest> val = new();

                val.RuleFor(p => p.Token)
                    .NotNull()
                    .NotEmpty()
                    .Length(1, 500);

                val.RuleFor(p => p.Password)
                    .NotEmpty()
                    .Length(min: 8, max: 100)
                    .Password()
                    .WithMessage(errorMessage: "Password does not meet minium requirements");

                return val;
            }

            public static IValidator<RegSubmitRequest> GetAdminValidator()
            {
                InlineValidator<RegSubmitRequest> val = new();

                val.RuleFor(p => p.Password)
                    .NotEmpty()
                    .Length(min: 8, max: 100)
                    .Password()
                    .WithMessage(errorMessage: "Password does not meet minium requirements");

                val.RuleFor(p => p.AdminUsername)
                    .NotNull()
                    .NotEmpty()
                    .EmailAddress()
                    .Length(min: 1, max: 100);

                return val;
            }
        }
    }
}

// Copyright (C) 2025 Vaughn Nugent
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
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

using FluentValidation;

using VNLib.Utils.Memory;
using VNLib.Utils.Logging;
using VNLib.Hashing;
using VNLib.Hashing.IdentityUtility;
using VNLib.Plugins;
using VNLib.Plugins.Essentials;
using VNLib.Plugins.Essentials.Accounts;
using VNLib.Plugins.Essentials.Users;
using VNLib.Plugins.Extensions.Loading;
using VNLib.Plugins.Extensions.Validation;
using VNLib.Plugins.Extensions.Loading.Users;
using VNLib.Plugins.Extensions.Loading.Events;
using VNLib.Plugins.Essentials.Accounts.AccountRpc;
using VNLib.Plugins.Extensions.Loading.Configuration;

namespace SimpleBookmark.Admin
{
    [ServiceExport]
    [ConfigurationName("simple_bookmark")]
    public sealed class SbAdminController(PluginBase plugin, IConfigScope config) : IAccountRpcController
    {
        private readonly IUserManager Users = plugin.GetOrCreateSingleton<UserManager>();
        private readonly ILogProvider Log = plugin.Log.CreateScope("SB-Admin");

        public IAccountRpcMethod[] GetMethods()
        {
            //If registration is disabled, do not load any methods
            if (!plugin.HostArgs.HasArgument("--disable-registation"))
            {
                AdminConfigJson Config = config.DeserialzeAndValidate<AdminConfigJson>();
                JwtAuthManager AuthMan = new(Config.TokenKeySize);

                Config.SetupMode = plugin.HostArgs.HasArgument("--setup");

                return [
                    new MainMethod(Config),
                    new InviteMethod(Config, Users, AuthMan),
                    new RegistrationMethod(Config, Users, AuthMan)
               ];
            }
            else
            {
                Log.Information("User registration is disabled");
                return [];
            }
        }

        private sealed class MainMethod(AdminConfigJson Config) : IAccountRpcMethod
        {
            ///<inheritdoc/>
            public string MethodName => "sb.admin";

            ///<inheritdoc/>
            public RpcMethodOptions Flags => RpcMethodOptions.None;

            public ValueTask<object?> OnUserGetAsync(HttpEntity entity)
            {
                if (entity.IsClientAuthorized(AuthorzationCheckLevel.Critical))
                {
                    return ValueTask.FromResult<object?>(new
                    {
                        type                = "sb.admin",
                        setup_mode          = Config.SetupMode,
                        can_invite          = entity.Session.CanAddUser(),
                        link_expiration     = Config.TokenLifetimeMinutes * 60
                    });
                }
                else
                {
                    return ValueTask.FromResult<object?>(new 
                    {
                        type = "sb.admin",
                        setup_mode = Config.SetupMode
                    });
                }
            }

            ///<inheritdoc/>
            public ValueTask<RpcCommandResult> InvokeAsync(HttpEntity entity, AccountJRpcRequest message, JsonElement request)
            {
                return ValueTask.FromResult(RpcCommandResult.Okay());
            }
        }

        private sealed class InviteMethod(AdminConfigJson Config, IUserManager Users, JwtAuthManager AuthMan) : IAccountRpcMethod
        {
            private readonly IValidator<NewUserRequest> _newRequestValidator = NewUserRequest.GetValidator();

            ///<inheritdoc/>
            public string MethodName => "sb.admin.invite";

            ///<inheritdoc/>
            public RpcMethodOptions Flags => RpcMethodOptions.AuthRequired;

            ///<inheritdoc/>
            public ValueTask<object?> OnUserGetAsync(HttpEntity entity) => default;

            ///<inheritdoc/>
            public async ValueTask<RpcCommandResult> InvokeAsync(HttpEntity entity, AccountJRpcRequest message, JsonElement request)
            {
                WebMessage webm = new();

                if (webm.Assert(entity.Session.CanAddUser(), "You do not have permissions to create new users"))
                {
                    return RpcCommandResult.Error(HttpStatusCode.Forbidden, webm);
                }

                NewUserRequest? req = request.Deserialize<NewUserRequest>();
                if (webm.Assert(req != null, "No request body provided"))
                {
                    return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
                }

                if (!_newRequestValidator.Validate(req, webm))
                {
                    return RpcCommandResult.Error(HttpStatusCode.UnprocessableEntity, webm);
                }

                //Make sure the user does not already exist
                using (IUser? user = await Users.GetUserFromUsernameAsync(req.Username!, entity.EventCancellation))
                {
                    if (webm.Assert(user == null, "User already exists"))
                    {
                        return RpcCommandResult.Error(HttpStatusCode.Conflict, webm);
                    }
                }

                //Start with min user privilages
                ulong privileges = RoleHelpers.MinUserRole;

                //Optionally allow the user to add new userse
                if (req.CanAddUsers)
                {
                    privileges = RoleHelpers.WithAddUserRole(privileges);
                }

                //Init new request
                using JsonWebToken jwt = new();

                //issue new payload for registration
                jwt.WritePayload(new RegistrationJwtPayload
                {
                    Expiration      = entity.RequestedTimeUtc.AddMinutes(Config.TokenLifetimeMinutes).ToUnixTimeSeconds(),
                    Subject         = req.Username!,
                    PrivLevel       = privileges,
                    Nonce           = RandomHash.GetRandomHex(16)
                });

                AuthMan.SignJwt(jwt);

                webm.Result = jwt.Compile();
                webm.Success = true;

                return RpcCommandResult.Okay(webm);
            }

            private sealed class NewUserRequest
            {
                [JsonPropertyName("username")]
                public string Username { get; set; } = string.Empty;

                [JsonPropertyName("can_add_users")]
                public bool CanAddUsers { get; set; }

                public static IValidator<NewUserRequest> GetValidator()
                {
                    InlineValidator<NewUserRequest> val = [];

                    val.RuleFor(p => p.Username)
                        .NotNull()
                        .NotEmpty()
                        .EmailAddress()
                        .Length(1, 200);

                    return val;
                }
            }
        }

        private sealed class RegistrationMethod(AdminConfigJson Config, IUserManager Users, JwtAuthManager AuthMan) : IAccountRpcMethod
        {
            private static readonly IValidator<RegSubmitRequest> RegSubmitVal = RegSubmitRequest.GetValidator();
            private static readonly IValidator<RegSubmitRequest> AdminRegVal = RegSubmitRequest.GetAdminValidator();

            ///<inheritdoc/>
            public string MethodName => "sb.admin.register";

            ///<inheritdoc/>
            public RpcMethodOptions Flags => RpcMethodOptions.None;

            ///<inheritdoc/>
            public ValueTask<object?> OnUserGetAsync(HttpEntity entity) => default;

            ///<inheritdoc/>
            public async ValueTask<RpcCommandResult> InvokeAsync(HttpEntity entity, AccountJRpcRequest message, JsonElement request)
            {
                WebMessage webm = new();

                using RegSubmitRequest? req = request.Deserialize<RegSubmitRequest>();

                if (webm.Assert(req != null, "No request body provided."))
                {
                    return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
                }

                //Users can specify an admin username when setup mode is enabled
                if (!string.IsNullOrWhiteSpace(req.AdminUsername))
                {
                    if (webm.Assert(Config.SetupMode, "Admin registation is not enabled."))
                    {
                        return RpcCommandResult.Error(HttpStatusCode.Forbidden, webm);
                    }

                    //Validate against admin reg
                    if (!AdminRegVal.Validate(req, webm))
                    {
                        return RpcCommandResult.Error(HttpStatusCode.UnprocessableEntity, webm);
                    }

                    try
                    {
                        //Default to min user privilages + add user privilages, technically the same as admin here
                        ulong adminPriv = RoleHelpers.WithAddUserRole(RoleHelpers.MinUserRole);

                        await CreateUserAsync(req.AdminUsername, adminPriv, req.Password, entity.EventCancellation);

                        webm.Result = "Successfully created your new admin account.";
                        webm.Success = true;

                        return RpcCommandResult.Okay(webm);
                    }
                    catch (UserExistsException)
                    {
                        webm.Result = "User account already exists";
                    }

                    return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
                }

                //Normal link registration
                if (!RegSubmitVal.Validate(req, webm))
                {
                    return RpcCommandResult.Error(HttpStatusCode.UnprocessableEntity, webm);
                }

                try
                {
                    //Try to recover the initial jwt from the request
                    using JsonWebToken jwt = JsonWebToken.Parse(req.Token!);

                    if (webm.Assert(AuthMan.VerifyJwt(jwt), "Registation failed, your link is invalid."))
                    {
                        return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
                    }

                    RegistrationJwtPayload p = jwt.GetPayload<RegistrationJwtPayload>()!;

                    //Make sure the token is not expired
                    if (webm.Assert(p.Expiration > entity.RequestedTimeUtc.ToUnixTimeSeconds(), "Registation failed, your link has expired"))
                    {
                        return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
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

                            return RpcCommandResult.Error(HttpStatusCode.Conflict, webm);
                        }
                    }

                    //Create the new user
                    await CreateUserAsync(p.Subject, p.PrivLevel, req.Password, entity.EventCancellation);

                    webm.Result = "Successfully created you new account!";
                    webm.Success = true;

                    return RpcCommandResult.Okay(webm);
                }
                catch (FormatException)
                {
                    webm.Result = "Registation failed, your link is invalid.";
                    return RpcCommandResult.Error(HttpStatusCode.BadRequest, webm);
                }
            }

            private async Task CreateUserAsync(string userName, ulong privLevel, string? password, CancellationToken cancellation)
            {
                //Create the new user
                UserCreationRequest newUser = new()
                {
                    Username        = userName,
                    InitialStatus   = UserStatus.Active,
                    Privileges      = privLevel,
                    Password        = PrivateString.ToPrivateString(password, ownsString: false),
                };

                using IUser user = await Users.CreateUserAsync(newUser, userId: null, Users.GetHashProvider(), cancellation);

                //Assign a local account status and email address
                user.SetAccountOrigin(AccountUtil.LOCAL_ACCOUNT_ORIGIN);
                user.EmailAddress = userName;

                await user.ReleaseAsync(cancellation);
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

        private sealed class RegistrationJwtPayload
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

        private sealed class AdminConfigJson : IOnConfigValidation
        {
            [JsonPropertyName("setup_mode")]
            public bool SetupMode { get; set; }

            [JsonPropertyName("token_lifetime_mins")]
            public int TokenLifetimeMinutes { get; init; } = 60;

            [JsonPropertyName("token_key_size")]
            public int TokenKeySize { get; init; } = 32;

            public void OnValidate()
            {
                Validate.Range(TokenLifetimeMinutes, 1, 1440, "token_lifetime_mins");
                Validate.Range(TokenKeySize, 16, 256, "token_key_size");
            }
        }

    }
}

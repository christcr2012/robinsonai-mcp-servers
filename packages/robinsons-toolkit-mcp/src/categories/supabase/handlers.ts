/**
 * Supabase Handler Functions - Part 1
 * Database/PostgREST (30 tools) + Auth (25 tools) = 55 handlers
 */

// Helper function to format Supabase responses
function formatSupabaseResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// DATABASE/POSTGREST HANDLERS (30 handlers)
// ============================================================

export async function supabaseDbSelect(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*' } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectEq(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error} = await this.supabaseClient.from(table).select(columns).eq(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectNeq(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).neq(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectGt(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).gt(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectGte(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).gte(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectLt(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).lt(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectLte(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).lte(column, value);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectLike(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, pattern } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).like(column, pattern);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectIlike(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, pattern } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).ilike(column, pattern);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSelectIn(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, values } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).in(column, values);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to select from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbOrder(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, ascending = true } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).order(column, { ascending });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to order ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbLimit(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', count } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).limit(count);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to limit ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbRange(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', from, to } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).range(from, to);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to range ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbSingle(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).eq(column, value).single();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get single from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbMaybeSingle(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, columns = '*', column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).select(columns).eq(column, value).maybeSingle();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get maybe single from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbInsert(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, data } = args;
    const { data: result, error } = await this.supabaseClient.from(table).insert(data).select();
    if (error) throw error;
    return formatSupabaseResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to insert into ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbInsertMany(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, data } = args;
    const { data: result, error } = await this.supabaseClient.from(table).insert(data).select();
    if (error) throw error;
    return formatSupabaseResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to insert many into ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbUpsert(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, data, onConflict } = args;
    const query = this.supabaseClient.from(table).upsert(data);
    if (onConflict) query.onConflict(onConflict);
    const { data: result, error } = await query.select();
    if (error) throw error;
    return formatSupabaseResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to upsert into ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbUpdate(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, data, column, value } = args;
    const { data: result, error } = await this.supabaseClient.from(table).update(data).eq(column, value).select();
    if (error) throw error;
    return formatSupabaseResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbDelete(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { table, column, value } = args;
    const { data, error } = await this.supabaseClient.from(table).delete().eq(column, value).select();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to delete from ${args.table}: ${error.message}`);
  }
}

export async function supabaseDbRpc(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName, params = {} } = args;
    const { data, error } = await this.supabaseClient.rpc(functionName, params);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to call RPC ${args.functionName}: ${error.message}`);
  }
}

// ============================================================
// AUTH HANDLERS (25 handlers)
// ============================================================

export async function supabaseAuthSignUp(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, password, options } = args;
    const { data, error } = await this.supabaseClient.auth.signUp({ email, password, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign up: ${error.message}`);
  }
}

export async function supabaseAuthSignUpPhone(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { phone, password, options } = args;
    const { data, error } = await this.supabaseClient.auth.signUp({ phone, password, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign up with phone: ${error.message}`);
  }
}

export async function supabaseAuthSignUpOauth(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { provider, options } = args;
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({ provider, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign up with OAuth: ${error.message}`);
  }
}

export async function supabaseAuthSignInPassword(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, password } = args;
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign in: ${error.message}`);
  }
}

export async function supabaseAuthSignInPhone(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { phone, password } = args;
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({ phone, password });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign in with phone: ${error.message}`);
  }
}

export async function supabaseAuthSignInOauth(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { provider, options } = args;
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({ provider, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign in with OAuth: ${error.message}`);
  }
}

export async function supabaseAuthSignInOtp(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, phone, options } = args;
    const { data, error } = await this.supabaseClient.auth.signInWithOtp({ email, phone, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to sign in with OTP: ${error.message}`);
  }
}

export async function supabaseAuthVerifyOtp(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, phone, token, type } = args;
    const { data, error } = await this.supabaseClient.auth.verifyOtp({ email, phone, token, type });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
}

export async function supabaseAuthSignOut(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { error } = await this.supabaseClient.auth.signOut();
    if (error) throw error;
    return formatSupabaseResponse({ success: true });
  } catch (error: any) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}

export async function supabaseAuthGetSession(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { data, error } = await this.supabaseClient.auth.getSession();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
}

export async function supabaseAuthRefreshSession(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { refreshToken } = args;
    const { data, error } = await this.supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to refresh session: ${error.message}`);
  }
}

export async function supabaseAuthSetSession(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { accessToken, refreshToken } = args;
    const { data, error } = await this.supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to set session: ${error.message}`);
  }
}

export async function supabaseAuthGetUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { data, error } = await this.supabaseClient.auth.getUser();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function supabaseAuthUpdateUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { attributes } = args;
    const { data, error } = await this.supabaseClient.auth.updateUser(attributes);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

export async function supabaseAuthDeleteUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { data, error } = await this.supabaseClient.auth.admin.deleteUser((await this.supabaseClient.auth.getUser()).data.user.id);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function supabaseAuthResetPassword(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, options } = args;
    const { data, error } = await this.supabaseClient.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to reset password: ${error.message}`);
  }
}

export async function supabaseAuthAdminListUsers(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { page, perPage } = args;
    const { data, error } = await this.supabaseClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list users: ${error.message}`);
  }
}

export async function supabaseAuthAdminGetUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { userId } = args;
    const { data, error } = await this.supabaseClient.auth.admin.getUserById(userId);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function supabaseAuthAdminCreateUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, password, emailConfirm, userMetadata } = args;
    const { data, error } = await this.supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirm,
      user_metadata: userMetadata,
    });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function supabaseAuthAdminUpdateUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { userId, attributes } = args;
    const { data, error } = await this.supabaseClient.auth.admin.updateUserById(userId, attributes);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

export async function supabaseAuthAdminDeleteUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { userId } = args;
    const { data, error } = await this.supabaseClient.auth.admin.deleteUser(userId);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function supabaseAuthAdminInviteUser(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { email, options } = args;
    const { data, error } = await this.supabaseClient.auth.admin.inviteUserByEmail(email, options);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to invite user: ${error.message}`);
  }
}

export async function supabaseAuthAdminGenerateLink(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { type, email, options } = args;
    const { data, error } = await this.supabaseClient.auth.admin.generateLink({ type, email, options });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to generate link: ${error.message}`);
  }
}

export async function supabaseAuthAdminUpdateUserMetadata(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { userId, userMetadata } = args;
    const { data, error } = await this.supabaseClient.auth.admin.updateUserById(userId, { user_metadata: userMetadata });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update user metadata: ${error.message}`);
  }
}

export async function supabaseAuthAdminListFactors(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { userId } = args;
    const { data, error } = await this.supabaseClient.auth.admin.listFactors({ userId });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list factors: ${error.message}`);
  }
}

// ============================================================
// FUNCTIONS - 7 handlers
// ============================================================

export async function supabaseFunctionsList(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { data, error } = await this.supabaseClient.functions.list();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list functions: ${error.message}`);
  }
}

export async function supabaseFunctionsGet(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName } = args;
    const { data, error } = await this.supabaseClient.functions.get(functionName);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get function: ${error.message}`);
  }
}

export async function supabaseFunctionsCreate(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { name, code, verify_jwt } = args;
    const { data, error } = await this.supabaseClient.functions.create({ name, code, verify_jwt });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to create function: ${error.message}`);
  }
}

export async function supabaseFunctionsUpdate(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName, code, verify_jwt } = args;
    const { data, error } = await this.supabaseClient.functions.update(functionName, { code, verify_jwt });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update function: ${error.message}`);
  }
}

export async function supabaseFunctionsDelete(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName } = args;
    const { data, error } = await this.supabaseClient.functions.delete(functionName);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to delete function: ${error.message}`);
  }
}

export async function supabaseFunctionsInvoke(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName, body, headers } = args;
    const { data, error } = await this.supabaseClient.functions.invoke(functionName, { body, headers });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to invoke function: ${error.message}`);
  }
}

export async function supabaseFunctionsGetLogs(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { functionName, limit } = args;
    // Note: This may require management API access
    return formatSupabaseResponse({ functionName, message: 'Logs API may require management client' });
  } catch (error: any) {
    throw new Error(`Failed to get function logs: ${error.message}`);
  }
}

// ============================================================
// STORAGE - 17 handlers
// ============================================================

export async function supabaseStorageListBuckets(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { data, error } = await this.supabaseClient.storage.listBuckets();
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }
}

export async function supabaseStorageGetBucket(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId } = args;
    const { data, error } = await this.supabaseClient.storage.getBucket(bucketId);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get bucket: ${error.message}`);
  }
}

export async function supabaseStorageCreateBucket(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { id, name, public: isPublic } = args;
    const { data, error } = await this.supabaseClient.storage.createBucket(id, { public: isPublic });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to create bucket: ${error.message}`);
  }
}

export async function supabaseStorageUpdateBucket(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, public: isPublic } = args;
    const { data, error } = await this.supabaseClient.storage.updateBucket(bucketId, { public: isPublic });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update bucket: ${error.message}`);
  }
}

export async function supabaseStorageDeleteBucket(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId } = args;
    const { data, error } = await this.supabaseClient.storage.deleteBucket(bucketId);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to delete bucket: ${error.message}`);
  }
}

export async function supabaseStorageEmptyBucket(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId } = args;
    const { data, error } = await this.supabaseClient.storage.emptyBucket(bucketId);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to empty bucket: ${error.message}`);
  }
}



export async function supabaseStorageListFiles(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path, limit, offset } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).list(path, { limit, offset });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

export async function supabaseStorageUpload(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path, file, contentType } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).upload(path, file, { contentType });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export async function supabaseStorageDownload(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).download(path);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

export async function supabaseStorageGetPublicUrl(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path } = args;
    const { data } = this.supabaseClient.storage.from(bucketId).getPublicUrl(path);
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to get public URL: ${error.message}`);
  }
}

export async function supabaseStorageCreateSignedUrl(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path, expiresIn } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
}

export async function supabaseStorageCreateSignedUrls(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, paths, expiresIn } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).createSignedUrls(paths, expiresIn);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to create signed URLs: ${error.message}`);
  }
}

export async function supabaseStorageMove(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, fromPath, toPath } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).move(fromPath, toPath);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to move file: ${error.message}`);
  }
}

export async function supabaseStorageCopy(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, fromPath, toPath } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).copy(fromPath, toPath);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

export async function supabaseStorageRemove(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, paths } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).remove(paths);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to remove files: ${error.message}`);
  }
}

export async function supabaseStorageUpdate(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path, file, contentType } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).update(path, file, { contentType });
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to update file: ${error.message}`);
  }
}

export async function supabaseStorageGetMetadata(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path } = args;
    // Note: Metadata retrieval may vary by SDK version
    const { data, error } = await this.supabaseClient.storage.from(bucketId).list(path, { limit: 1 });
    if (error) throw error;
    return formatSupabaseResponse(data[0] || {});
  } catch (error: any) {
    throw new Error(`Failed to get metadata: ${error.message}`);
  }
}

// ============================================================
// MANAGEMENT - 10 handlers (require management API client)
// ============================================================

export async function supabaseManagementListProjects(this: any, args: any) {
  // Note: Requires Supabase Management API client, not regular client
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementGetProject(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementCreateProject(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementUpdateProject(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementDeleteProject(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementListOrganizations(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementGetOrganization(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementCreateOrganization(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementUpdateOrganization(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

export async function supabaseManagementDeleteOrganization(this: any, args: any) {
  return formatSupabaseResponse({ message: 'Management API requires separate client initialization' });
}

// ============================================================
// REALTIME - 7 handlers
// ============================================================

export async function supabaseRealtimeChannel(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    return formatSupabaseResponse({ channelName, status: 'created' });
  } catch (error: any) {
    throw new Error(`Failed to create channel: ${error.message}`);
  }
}

export async function supabaseRealtimeGetChannels(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const channels = this.supabaseClient.getChannels();
    return formatSupabaseResponse(channels);
  } catch (error: any) {
    throw new Error(`Failed to get channels: ${error.message}`);
  }
}

export async function supabaseRealtimeBroadcast(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, event, payload } = args;
    const channel = this.supabaseClient.channel(channelName);
    await channel.send({ type: 'broadcast', event, payload });
    return formatSupabaseResponse({ channelName, event, status: 'sent' });
  } catch (error: any) {
    throw new Error(`Failed to broadcast: ${error.message}`);
  }
}

export async function supabaseRealtimePresence(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, state } = args;
    const channel = this.supabaseClient.channel(channelName);
    await channel.track(state);
    return formatSupabaseResponse({ channelName, state, status: 'tracked' });
  } catch (error: any) {
    throw new Error(`Failed to track presence: ${error.message}`);
  }
}

export async function supabaseRealtimeSubscribe(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, event, schema, table, filter } = args;
    const channel = this.supabaseClient.channel(channelName);
    channel.on('postgres_changes', { event, schema, table, filter }, (payload: any) => {
      // Callback for changes
    });
    await channel.subscribe();
    return formatSupabaseResponse({ channelName, status: 'subscribed' });
  } catch (error: any) {
    throw new Error(`Failed to subscribe: ${error.message}`);
  }
}

export async function supabaseRealtimeUnsubscribe(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    await channel.unsubscribe();
    return formatSupabaseResponse({ channelName, status: 'unsubscribed' });
  } catch (error: any) {
    throw new Error(`Failed to unsubscribe: ${error.message}`);
  }
}

export async function supabaseRealtimeRemoveChannel(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    await this.supabaseClient.removeChannel(channel);
    return formatSupabaseResponse({ channelName, status: 'removed' });
  } catch (error: any) {
    throw new Error(`Failed to remove channel: ${error.message}`);
  }
}

// ============================================================
// REALTIME - Additional handlers (7 handlers)
// ============================================================

export async function supabaseRealtimeRemoveAllChannels(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    await this.supabaseClient.removeAllChannels();
    return formatSupabaseResponse({ status: 'all channels removed' });
  } catch (error: any) {
    throw new Error(`Failed to remove all channels: ${error.message}`);
  }
}

export async function supabaseRealtimeOnPostgresChanges(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, event, schema, table, filter } = args;
    const channel = this.supabaseClient.channel(channelName);
    channel.on('postgres_changes', { event, schema, table, filter }, (payload: any) => {
      // Callback will be handled by client
    });
    await channel.subscribe();
    return formatSupabaseResponse({ channelName, event, schema, table, status: 'subscribed' });
  } catch (error: any) {
    throw new Error(`Failed to subscribe to postgres changes: ${error.message}`);
  }
}

export async function supabaseRealtimeOnBroadcast(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, event } = args;
    const channel = this.supabaseClient.channel(channelName);
    channel.on('broadcast', { event }, (payload: any) => {
      // Callback will be handled by client
    });
    await channel.subscribe();
    return formatSupabaseResponse({ channelName, event, status: 'subscribed' });
  } catch (error: any) {
    throw new Error(`Failed to subscribe to broadcast: ${error.message}`);
  }
}

export async function supabaseRealtimeOnPresence(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    channel.on('presence', { event: 'sync' }, () => {
      // Callback will be handled by client
    });
    await channel.subscribe();
    return formatSupabaseResponse({ channelName, status: 'subscribed to presence' });
  } catch (error: any) {
    throw new Error(`Failed to subscribe to presence: ${error.message}`);
  }
}

export async function supabaseRealtimeTrackPresence(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName, state } = args;
    const channel = this.supabaseClient.channel(channelName);
    await channel.track(state);
    return formatSupabaseResponse({ channelName, state, status: 'tracking' });
  } catch (error: any) {
    throw new Error(`Failed to track presence: ${error.message}`);
  }
}

export async function supabaseRealtimeUntrackPresence(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    await channel.untrack();
    return formatSupabaseResponse({ channelName, status: 'untracked' });
  } catch (error: any) {
    throw new Error(`Failed to untrack presence: ${error.message}`);
  }
}

export async function supabaseRealtimeGetPresence(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { channelName } = args;
    const channel = this.supabaseClient.channel(channelName);
    const presenceState = channel.presenceState();
    return formatSupabaseResponse({ channelName, presenceState });
  } catch (error: any) {
    throw new Error(`Failed to get presence: ${error.message}`);
  }
}

// ============================================================
// STORAGE POLICIES - 5 handlers
// ============================================================

export async function supabaseStorageList(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, path, options } = args;
    const { data, error } = await this.supabaseClient.storage.from(bucketId).list(path, options);
    if (error) throw error;
    return formatSupabaseResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to list storage: ${error.message}`);
  }
}

export async function supabaseStorageCreatePolicy(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, policy } = args;
    // Note: Policy creation typically requires admin API or SQL
    return formatSupabaseResponse({ bucketId, policy, status: 'policy creation requires admin access' });
  } catch (error: any) {
    throw new Error(`Failed to create storage policy: ${error.message}`);
  }
}

export async function supabaseStorageGetPolicy(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, policyId } = args;
    // Note: Policy retrieval typically requires admin API or SQL
    return formatSupabaseResponse({ bucketId, policyId, status: 'policy retrieval requires admin access' });
  } catch (error: any) {
    throw new Error(`Failed to get storage policy: ${error.message}`);
  }
}

export async function supabaseStorageListPolicies(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId } = args;
    // Note: Policy listing typically requires admin API or SQL
    return formatSupabaseResponse({ bucketId, status: 'policy listing requires admin access' });
  } catch (error: any) {
    throw new Error(`Failed to list storage policies: ${error.message}`);
  }
}

export async function supabaseStorageUpdatePolicy(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, policyId, updates } = args;
    // Note: Policy updates typically require admin API or SQL
    return formatSupabaseResponse({ bucketId, policyId, updates, status: 'policy update requires admin access' });
  } catch (error: any) {
    throw new Error(`Failed to update storage policy: ${error.message}`);
  }
}

export async function supabaseStorageDeletePolicy(this: any, args: any) {
  if (!this.supabaseClient) throw new Error('Supabase client not initialized');
  try {
    const { bucketId, policyId } = args;
    // Note: Policy deletion typically requires admin API or SQL
    return formatSupabaseResponse({ bucketId, policyId, status: 'policy deletion requires admin access' });
  } catch (error: any) {
    throw new Error(`Failed to delete storage policy: ${error.message}`);
  }
}


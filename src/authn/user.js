import dotenv from 'dotenv';
dotenv.config();

import rp from 'request-promise-native';
import authn_providers_m from "./providers";
const AUTHN_PROVIDERS = authn_providers_m();


const serialize_user = (user, done) => {
  // console.log('serialize_user', user);
  done(null, user)
};


const deserialize_user = (user, done) => {
  // console.log('deserialize_user', user);
  done(null, user)
};


const current_user_props = async (req, res) => {
  const response = {};
  let authenticated = !!(req.session.passport && req.session.passport.user);
  try {
    const user = req.session.passport.user;
    const profile = await check_current_user(req);
    authenticated = profile && profile.authenticated;
    if (authenticated) {
      const provider = AUTHN_PROVIDERS[user.authn.iss_id];
      const page_props = provider.user_profile_to_client_page_props(profile);
      Object.assign(response, page_props);
    }
  } catch (e) {
    authenticated = false;
    response.authn_error = e.toString();
  }
  response.authenticated = authenticated;
  res.json(response);
};


const check_current_user = async (req) => {
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if (authenticated) {
    const user = req.session.passport.user;
    const provider = AUTHN_PROVIDERS[user.authn.iss_id];
    let profile;
    try {
      const rp_opts = {
        uri: process.env.LAYMAN_USER_PROFILE_URL,
        headers: provider.get_authn_headers(user),
        json: true
      };
      profile = await rp(rp_opts);
      authenticated = profile.authenticated;
    } catch (e) {
      console.log('AUTOMATICALLY LOGGING OUT');
      req.logout();
      throw e;
    }
    if(authenticated) {
      return profile;
    } else {
      console.log('AUTOMATICALLY LOGGING OUT');
      req.logout();
    }
  }
  return null;
};



export default {
  serialize_user,
  deserialize_user,
  current_user_props,
  check_current_user,
}
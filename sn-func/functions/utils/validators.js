const isEmpty = (string) => {
  if (string.trim() === "") return true;
  return false;
};

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  return false;
};

exports.validateSignupData = ({ email, password, confirmPassword, handle }) => {
  const errors = {};
  if (isEmpty(email)) {
    errors.email = "email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "must be a valid email adress";
  }

  if (isEmpty(password)) errors.password = "password must not be empty";
  if (password !== confirmPassword)
    errors.confirmPassword = "passwords must be the same";

  if (isEmpty(handle)) errors.handle = "handle must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
};

exports.validateLoginData = ({ email, password }) => {
  const errors = {};
  if (isEmpty(email)) errors.email = "Must not be empty";
  else if (!isEmail(email)) errors.email = "Must be valid email";
  if (isEmpty(password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
};

exports.reduceUserDetails = ({ bio, website, location }) => {
  const userDetails = {};
  const b = bio ? bio.trim() : "";
  const w = website ? website.trim() : "";
  const l = location ? location.trim() : "";
  if (!isEmpty(b)) userDetails.bio = b;
  if (!isEmpty(w)) {
    const http = "http";
    let validWebsite = w;
    if (w.substring(0, 4) !== http) validWebsite = `${http}://${w}`;
    userDetails.website = validWebsite;
  }
  if (!isEmpty(l)) userDetails.location = l;
  return userDetails;
};

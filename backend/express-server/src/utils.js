function cleanString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = {
  cleanString,
  toPublicUser,
};

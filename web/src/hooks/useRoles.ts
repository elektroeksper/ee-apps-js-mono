// DEPRECATED: Former convenience role hooks that wrapped useAuth().
// Removed to avoid accidental layering violations & potential circular deps.
// Use the role utilities exposed directly from useAuth():
//   const { isAdmin, userRoles, hasRole, hasAnyRole } = useAuth();
// If you need grouped permission logic, create a local helper that receives
// the auth context object instead of adding another hook here.
export { }; // keep file as empty module placeholder until fully deleted


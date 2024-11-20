export const checkRole = role => (req,res,next) => {
  if(req.user?.role !== role) {
    return res.status(403).send('forbidden access');
  }
  next()
}
/** Recursively map an array */

export function recursiveMap<T,U>(array:(U|U[])[],callback:(item:U)=>T):(T|T[])[]{

  return array.map( item =>
    Array.isArray(item)
      ? recursiveMap(item,callback) as T[]
      : callback(item)
  );
}
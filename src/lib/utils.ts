/** Recursively map an array */
export function recursiveMap<T,U>(array:(U|U[])[],callback:(item:U)=>T):(T|T[])[]{

  return array.map( item =>
    Array.isArray(item)
      ? recursiveMap(item,callback) as T[]
      : callback(item)
  );
}

/** Make fast insecure hash of object */
export function hashObject(obj:unknown){
  const str = JSON.stringify(obj);
  let h =0;
  for(let i = 0; i < str.length; i++)
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return String(h);
}
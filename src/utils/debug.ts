export  const logRecursive = (obj, indent = 2) => {
    try {
      const output = JSON.stringify(obj, null, indent);
      console.log(output);
    } catch (error) {
      // Fallback for circular references or objects that cannot be stringified (e.g., global window object)
      console.error("Could not stringify object (possibly circular reference). Falling back to console.dir:", obj);
      console.dir(obj);
    }
  };
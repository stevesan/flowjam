using UnityEngine;
using System.Collections.Generic;

namespace SteveSharp
{
    public class Utility
    {
        public static bool Assert( bool cond, string msg = "see callstack in log" )
        {
            if( !cond )
                Debug.LogError("Failed Assert: "+msg);
            return cond;
        }

        public static C MyInstantiate<C>( C prefab, Vector3 pos, Transform parent = null ) where C : MonoBehaviour
        {
            GameObject inst = (GameObject)GameObject.Instantiate(prefab.gameObject, pos, Quaternion.identity);
            inst.transform.parent = null;
            inst.SetActive(true);
            return inst.GetComponent<C>();
        }

        public static C FindAncestor<C>( GameObject obj ) where C:MonoBehaviour
        {
            while( true )
            {
                if( obj == null )
                    return null;

                C comp = obj.GetComponent<C>();
                if( comp != null )
                    return comp;

                if( obj.transform.parent == null )
                    return null;

                obj = obj.transform.parent.gameObject;
            }
        }
    }

}

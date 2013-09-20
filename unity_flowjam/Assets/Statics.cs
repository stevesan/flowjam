
using UnityEngine;
using System.Collections;

namespace SteveSharp
{
    public class UnityUtils
    {
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

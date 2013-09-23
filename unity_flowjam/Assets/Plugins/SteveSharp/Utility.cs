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
            inst.transform.parent = parent;
            inst.SetActive(true);
            return inst.GetComponent<C>();
        }

        public static GameObject Instantiate( GameObject prefab, Vector3 pos, Transform parent = null ) 
        {
            GameObject inst = (GameObject)GameObject.Instantiate(prefab.gameObject, pos, Quaternion.identity);
            inst.transform.parent = parent;
            inst.SetActive(true);
            return inst;
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

        public static bool CanSee<C>( C target, Vector3 startPos ) where C : MonoBehaviour
        {
            Vector3 toTarget = target.transform.position - startPos;
            RaycastHit hit = new RaycastHit();
            if( Physics.Raycast( startPos, toTarget.normalized, out hit ) )
            {
                C hitComp = FindAncestor<C>(hit.collider.gameObject);
                if( hitComp == target )
                    return true;
            }
            return false;
        }

        public static float Unlerp( float from, float to, float x )
        {
            return (x - from) / (to - from);
        }
    }

}

using UnityEngine;
using System.Collections;

public class HealthPotion : MonoBehaviour
{
    public int amount = 1;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

    public void OnConsumed()
    {
        Destroy(gameObject);
    }
}

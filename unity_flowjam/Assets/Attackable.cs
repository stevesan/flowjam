using UnityEngine;
using System.Collections;

public class Attackable : MonoBehaviour
{
    public GUIText word;

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

    public void OnEnterBlastRadius(BlastRadius radius)
    {
        word.color = Color.green;
    }

    public void OnExitBlastRadius(BlastRadius radius)
    {
        word.color = Color.white;
    }

    public void OnIsInDanger()
    {
        word.color = Color.red;
    }

    public void OnIsNotInDanger()
    {
        word.color = Color.green;
    }

    public string GetWord()
    {
        return word.text;
    }

    public void OnDamaged()
    {
        Destroy(gameObject);
    }
}
